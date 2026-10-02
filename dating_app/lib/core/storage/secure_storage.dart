import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorage {
  static const _accessTokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';
  static const _deviceIdKey = 'device_id';

  final FlutterSecureStorage _storage;
  final Map<String, String> _webMemoryFallback = {};

  SecureStorage({FlutterSecureStorage? storage})
      : _storage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(),
              iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
              webOptions: WebOptions(dbName: 'dating_app', publicKey: 'dating_pub'),
            );

  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    _webMemoryFallback[_accessTokenKey] = accessToken;
    _webMemoryFallback[_refreshTokenKey] = refreshToken;

    if (!kIsWeb) {
      try {
        await _storage.write(key: _accessTokenKey, value: accessToken);
        await _storage.write(key: _refreshTokenKey, value: refreshToken);
      } catch (_) {}
    }
  }

  Future<String?> getAccessToken() async {
    if (kIsWeb) return _webMemoryFallback[_accessTokenKey];
    try {
      final val = await _storage.read(key: _accessTokenKey);
      return val ?? _webMemoryFallback[_accessTokenKey];
    } catch (_) {
      return _webMemoryFallback[_accessTokenKey];
    }
  }

  Future<String?> getRefreshToken() async {
    if (kIsWeb) return _webMemoryFallback[_refreshTokenKey];
    try {
      final val = await _storage.read(key: _refreshTokenKey);
      return val ?? _webMemoryFallback[_refreshTokenKey];
    } catch (_) {
      return _webMemoryFallback[_refreshTokenKey];
    }
  }

  Future<void> saveDeviceId(String deviceId) async {
    _webMemoryFallback[_deviceIdKey] = deviceId;
    if (!kIsWeb) {
      try {
        await _storage.write(key: _deviceIdKey, value: deviceId);
      } catch (_) {}
    }
  }

  Future<String?> getDeviceId() async {
    if (kIsWeb) return _webMemoryFallback[_deviceIdKey];
    try {
      final val = await _storage.read(key: _deviceIdKey);
      return val ?? _webMemoryFallback[_deviceIdKey];
    } catch (_) {
      return _webMemoryFallback[_deviceIdKey];
    }
  }

  Future<void> clear() async {
    _webMemoryFallback.clear();
    if (!kIsWeb) {
      try {
        await _storage.delete(key: _accessTokenKey);
        await _storage.delete(key: _refreshTokenKey);
      } catch (_) {}
    }
  }
}
