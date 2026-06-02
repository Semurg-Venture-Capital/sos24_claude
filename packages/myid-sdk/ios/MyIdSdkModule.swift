import ExpoModulesCore
import MyIdSDK

public class MyIdSdkModule: Module {

  // Holds the active delegate to prevent premature deallocation during SDK flow.
  private var activeDelegate: MyIdDelegateHandler?

  public func definition() -> ModuleDefinition {
    Name("MyIdSdk")

    // start(sessionId, clientHash, clientHashId, environment) → Promise<{ code: String }>
    AsyncFunction("start") { (sessionId: String, clientHash: String, clientHashId: String, environment: String, promise: Promise) in
      DispatchQueue.main.async { [weak self] in
        guard let self else { return }

        let config = MyIdConfig()
        config.sessionId = sessionId
        config.clientHash = clientHash
        config.clientHashId = clientHashId
        config.environment = environment == "debug" ? .debug : .production
        config.locale = .russian

        let delegate = MyIdDelegateHandler(
          onSuccess: { code in
            promise.resolve(["code": code])
            self.activeDelegate = nil
          },
          onError: { errorCode, message in
            promise.reject(MyIdVerificationException(code: errorCode, message: message))
            self.activeDelegate = nil
          },
          onCancelled: {
            promise.reject(MyIdCancelledException())
            self.activeDelegate = nil
          }
        )

        self.activeDelegate = delegate
        MyIdClient.start(withConfig: config, withDelegate: delegate)
      }
    }
  }
}

// MARK: - Delegate Handler

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

  public func onSuccess(result: MyIdResult) {
    let code = result.code ?? ""
    onSuccess(code)
  }

  public func onError(exception: MyIdException) {
    onError(exception.code, exception.message ?? "Ошибка верификации MyID")
  }

  public func onUserExited() {
    onCancelled()
  }

  public func onEvent(event: MyIdEvent) {
    // No-op — можно добавить эмит событий при необходимости
  }
}

// MARK: - Exceptions

class MyIdCancelledException: Exception {
  override var reason: String {
    "Пользователь отменил верификацию MyID"
  }
}

class MyIdVerificationException: Exception {
  private let errorCode: Int
  private let errorMessage: String

  init(code: Int, message: String) {
    self.errorCode = code
    self.errorMessage = message
    super.init()
  }

  override var reason: String {
    "MyID ошибка \(errorCode): \(errorMessage)"
  }
}
