import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../domain/entities/user_entity.dart';
import '../../domain/repositories/auth_repository.dart';
import '../../../../core/error/failures.dart';
import '../datasources/auth_local_data_source.dart';
import '../datasources/auth_remote_data_source.dart';
import '../models/user_model.dart';

@LazySingleton(as: AuthRepository)
class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource _remote;
  final AuthLocalDataSource _local;

  const AuthRepositoryImpl(this._remote, this._local);

  @override
  Future<Either<Failure, UserEntity>> login(
    String email,
    String password,
  ) async {
    final result = await _remote.login(email, password);
    return result.fold<Future<Either<Failure, UserEntity>>>(
      (failure) async => Left(failure),
      (tokenModel) async {
        await _local.saveToken(tokenModel.accessToken);
        if (tokenModel.user != null) {
          await _local.saveUser(tokenModel.user!);
          return Right(_toEntityFromToken(tokenModel.user!));
        }
        return _fetchAndCacheUser();
      },
    );
  }

  @override
  Future<Either<Failure, UserEntity>> register({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    required String passwordConfirmation,
  }) async {
    final result = await _remote.register(
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: password,
      passwordConfirmation: passwordConfirmation,
    );
    return result.fold<Future<Either<Failure, UserEntity>>>(
      (failure) async => Left(failure),
      (tokenModel) async {
        await _local.saveToken(tokenModel.accessToken);
        if (tokenModel.user != null) {
          await _local.saveUser(tokenModel.user!);
          return Right(_toEntityFromToken(tokenModel.user!));
        }
        return const Right(UserEntity(
          id: 0,
          name: '',
          firstName: '',
          lastName: '',
          email: '',
          requiresVerification: true,
        ));
      },
    );
  }

  @override
  Future<Either<Failure, void>> verifyOtp(String otp) async {
    return _remote.verifyOtp(otp);
  }

  @override
  Future<Either<Failure, void>> resendOtp() async {
    return _remote.resendOtp();
  }

  @override
  Future<Either<Failure, VerificationStatus>> getVerificationStatus() async {
    final result = await _remote.getVerificationStatus();
    return result.map((model) => VerificationStatus(
          isVerified: model.isVerified,
          canResend: model.canResend,
          cooldownSeconds: model.cooldownSeconds,
        ));
  }

  @override
  Future<Either<Failure, UserEntity>> getCurrentUser() async {
    return _fetchAndCacheUser();
  }

  @override
  Future<Either<Failure, void>> logout() async {
    await _remote.logout();
    return _local.clearAll();
  }

  @override
  Future<Either<Failure, bool>> hasToken() async {
    final result = await _local.getToken();
    return result.map((token) => token != null);
  }

  Future<Either<Failure, UserEntity>> _fetchAndCacheUser() async {
    final result = await _remote.getCurrentUser();
    return result.fold<Future<Either<Failure, UserEntity>>>(
      (failure) async => Left(failure),
      (model) async {
        await _local.saveUser(model);
        return Right(_toEntity(model));
      },
    );
  }

  UserEntity _toEntity(UserModel model) => UserEntity(
        id: model.id,
        name: model.name,
        firstName: model.firstName,
        lastName: model.lastName,
        email: model.email,
        emailVerifiedAt: model.emailVerifiedAt,
        roles: model.roles,
        permissions: model.permissions,
      );

  /// Same as [_toEntity] but sets [requiresVerification] based on email_verified_at,
  /// matching the customer portal's approach of checking the user object directly.
  UserEntity _toEntityFromToken(UserModel model) => UserEntity(
        id: model.id,
        name: model.name,
        firstName: model.firstName,
        lastName: model.lastName,
        email: model.email,
        emailVerifiedAt: model.emailVerifiedAt,
        roles: model.roles,
        permissions: model.permissions,
        requiresVerification: model.emailVerifiedAt == null,
      );
}
