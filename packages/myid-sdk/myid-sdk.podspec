require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'myid-sdk'
  s.version        = package['version']
  s.summary        = 'Native bridge for MyID iOS SDK (SOS24)'
  s.description    = 'Expo native module wrapping MyIdSDK for biometric verification'
  s.author         = { 'SOS24' => 'dev@sos24.uz' }
  s.homepage       = 'https://sos24.uz'
  s.license        = { :type => 'MIT' }
  s.platforms      = { :ios => '13.0' }
  s.source         = { :git => '' }
  s.source_files   = 'ios/**/*.{h,m,mm,swift}'

  s.dependency 'ExpoModulesCore'
  s.dependency 'MyIdSDK', '~> 3.1.3'

  install_modules_dependencies(s)
end
