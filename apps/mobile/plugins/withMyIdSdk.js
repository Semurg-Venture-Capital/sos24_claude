/**
 * Config Plugin — MyID iOS SDK bridge
 *
 * Что делает:
 * 1. Пишет MyIdSdkModule.swift + MyIdSdkModule.m в ios/mobile/
 * 2. Добавляет оба файла в Xcode project (PBXGroup + Sources Build Phase)
 * 3. Добавляет pod MyIdSDK в Podfile
 */

const { withXcodeProject, withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

// ─── Swift implementation ───────────────────────────────────────────────────
const SWIFT_SOURCE = `\
import Foundation
import MyIdSDK

// RCT_EXTERN_MODULE bridge — регистрируется через MyIdSdkModule.m
@objc(MyIdSdkModule)
class MyIdSdkModule: NSObject {

  @objc static func requiresMainQueueSetup() -> Bool { true }

  // activeDelegate хранит делегата чтобы ARC не освободил его во время SDK-флоу
  private var activeDelegate: MyIdDelegateHandler?

  @objc func start(
    _ sessionId: String,
    clientHash: String,
    clientHashId: String,
    environment: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async { [weak self] in
      guard let self else { return }

      let config = MyIdConfig()
      config.sessionId = sessionId
      config.clientHash = clientHash
      config.clientHashId = clientHashId
      config.environment = environment == "debug" ? .debug : .production
      config.locale = .russian

      let handler = MyIdDelegateHandler(
        onSuccess: { [weak self] code in
          resolve(["code": code])
          self?.activeDelegate = nil
        },
        onError: { [weak self] errorCode, message in
          reject("MYID_ERROR", "MyID \\(errorCode): \\(message)", nil)
          self?.activeDelegate = nil
        },
        onCancelled: { [weak self] in
          reject("MYID_CANCELLED", "Пользователь отменил верификацию MyID", nil)
          self?.activeDelegate = nil
        }
      )

      self.activeDelegate = handler
      MyIdClient.start(withConfig: config, withDelegate: handler)
    }
  }
}

// Отдельный класс-делегат — не UIViewController, только колбэки
class MyIdDelegateHandler: NSObject, MyIdClientDelegate {
  private let onSuccess: (String) -> Void
  private let onError: (Int, String) -> Void
  private let onCancelled: () -> Void

  init(
    onSuccess: @escaping (String) -> Void,
    onError: @escaping (Int, String) -> Void,
    onCancelled: @escaping () -> Void
  ) {
    self.onSuccess = onSuccess
    self.onError = onError
    self.onCancelled = onCancelled
  }

  func onSuccess(result: MyIdResult) { onSuccess(result.code) }
  func onError(exception: MyIdException) { onError(exception.code, exception.message) }
  func onUserExited() { onCancelled() }
  func onEvent(event: MyIdEvent) {}
}
`;

// ─── ObjC bridge ────────────────────────────────────────────────────────────
const OBJC_SOURCE = `\
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(MyIdSdkModule, NSObject)

RCT_EXTERN_METHOD(
  start:(NSString *)sessionId
  clientHash:(NSString *)clientHash
  clientHashId:(NSString *)clientHashId
  environment:(NSString *)environment
  resolve:(RCTPromiseResolveBlock)resolve
  reject:(RCTPromiseRejectBlock)reject
)

+ (BOOL)requiresMainQueueSetup { return YES; }

@end
`;

// ─── 1. Write files to ios/mobile/ ─────────────────────────────────────────
const withMyIdSdkFiles = (config) =>
  withDangerousMod(config, [
    'ios',
    (config) => {
      // Имя iOS-проекта берём динамически (может быть mobile / SOS24 и т.п.).
      const dir = path.join(config.modRequest.platformProjectRoot, config.modRequest.projectName);
      fs.writeFileSync(path.join(dir, 'MyIdSdkModule.swift'), SWIFT_SOURCE, 'utf8');
      fs.writeFileSync(path.join(dir, 'MyIdSdkModule.m'), OBJC_SOURCE, 'utf8');
      return config;
    },
  ]);

// ─── 2. Add files to Xcode project ─────────────────────────────────────────
const withMyIdSdkXcode = (config) =>
  withXcodeProject(config, (config) => {
    const project = config.modResults;
    const projectName = config.modRequest.projectName;

    // Find the main app group (имя проекта: mobile / SOS24 и т.п.)
    const groupKey = project.findPBXGroupKey({ name: projectName });

    const filesToAdd = [
      { name: 'MyIdSdkModule.swift', type: 'sourcecode.swift' },
      { name: 'MyIdSdkModule.m',     type: 'sourcecode.c.objc' },
    ];

    for (const { name } of filesToAdd) {
      const filePath = `${projectName}/${name}`;
      // Skip if already referenced in project
      const alreadyAdded = Object.values(project.hash.project.objects.PBXFileReference || {})
        .some((ref) => typeof ref === 'object' && ref.path === `"${name}"`);
      if (alreadyAdded) continue;

      project.addSourceFile(filePath, { target: project.getFirstTarget().uuid }, groupKey);
    }

    return config;
  });

// ─── 3. Add MyIdSDK pod to Podfile ─────────────────────────────────────────
const withMyIdSdkPod = (config) =>
  withDangerousMod(config, [
    'ios',
    (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let podfile = fs.readFileSync(podfilePath, 'utf8');

      if (!podfile.includes("MyIdSDK")) {
        // Insert after `use_expo_modules!` line
        podfile = podfile.replace(
          /(\s*use_expo_modules!)/,
          `$1\n  pod 'MyIdSDK', '~> 3.1.3'   # MyID biometric SDK`,
        );
        fs.writeFileSync(podfilePath, podfile, 'utf8');
      }
      return config;
    },
  ]);

// ─── Compose ─────────────────────────────────────────────────────────────────
const withMyIdSdk = (config) => {
  config = withMyIdSdkFiles(config);
  config = withMyIdSdkXcode(config);
  config = withMyIdSdkPod(config);
  return config;
};

module.exports = withMyIdSdk;
