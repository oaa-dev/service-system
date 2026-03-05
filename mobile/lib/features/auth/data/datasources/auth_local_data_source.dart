import 'dart:convert';
import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/storage/secure_storage.dart';
import '../models/user_model.dart';

abstract class AuthLocalDataSource {
  Future<Either<Failure, String?>> getToken();
  Future<Either<Failure, void>> saveToken(String token);
  Future<Either<Failure, void>> deleteToken();
  Future<Either<Failure, UserModel?>> getCachedUser();
  Future<Either<Failure, void>> saveUser(UserModel user);
  Future<Either<Failure, void>> clearAll();
}

@LazySingleton(as: AuthLocalDataSource)
class AuthLocalDataSourceImpl implements AuthLocalDataSource {
  final SecureStorageService _secureStorage;

  const AuthLocalDataSourceImpl(this._secureStorage);

  @override
  Future<Either<Failure, String?>> getToken() async {
    try {
      final token = await _secureStorage.getToken();
      return Right(token);
    } catch (e) {
      return Left(CacheFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> saveToken(String token) async {
    try {
      await _secureStorage.saveToken(token);
      return const Right(null);
    } catch (e) {
      return Left(CacheFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> deleteToken() async {
    try {
      await _secureStorage.deleteToken();
      return const Right(null);
    } catch (e) {
      return Left(CacheFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, UserModel?>> getCachedUser() async {
    try {
      final userJson = await _secureStorage.getUser();
      if (userJson == null) return const Right(null);
      final decoded = jsonDecode(userJson) as Map<String, dynamic>;
      return Right(UserModel.fromJson(decoded));
    } catch (e) {
      return Left(CacheFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> saveUser(UserModel user) async {
    try {
      await _secureStorage.saveUser(jsonEncode(user.toJson()));
      return const Right(null);
    } catch (e) {
      return Left(CacheFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> clearAll() async {
    try {
      await _secureStorage.deleteAll();
      return const Right(null);
    } catch (e) {
      return Left(CacheFailure(e.toString()));
    }
  }
}
