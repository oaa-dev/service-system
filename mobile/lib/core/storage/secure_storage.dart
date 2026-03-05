import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:injectable/injectable.dart';
import '../constants/app_constants.dart';

@lazySingleton
class SecureStorageService {
  final FlutterSecureStorage _storage;

  const SecureStorageService(this._storage);

  Future<String?> getToken() => _storage.read(key: AppConstants.tokenKey);

  Future<void> saveToken(String token) =>
      _storage.write(key: AppConstants.tokenKey, value: token);

  Future<void> deleteToken() => _storage.delete(key: AppConstants.tokenKey);

  Future<String?> getUser() => _storage.read(key: AppConstants.userKey);

  Future<void> saveUser(String userJson) =>
      _storage.write(key: AppConstants.userKey, value: userJson);

  Future<void> deleteUser() => _storage.delete(key: AppConstants.userKey);

  Future<void> deleteAll() => _storage.deleteAll();
}
