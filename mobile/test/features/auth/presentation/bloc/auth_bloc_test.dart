import 'package:bloc_test/bloc_test.dart';
import 'package:fpdart/fpdart.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:mobile/core/error/failures.dart';
import 'package:mobile/features/auth/domain/entities/user_entity.dart';
import 'package:mobile/features/auth/domain/usecases/check_auth_status_use_case.dart';
import 'package:mobile/features/auth/domain/usecases/get_current_user_use_case.dart';
import 'package:mobile/features/auth/domain/usecases/login_use_case.dart';
import 'package:mobile/features/auth/domain/usecases/logout_use_case.dart';
import 'package:mobile/features/auth/domain/usecases/register_use_case.dart';
import 'package:mobile/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:mobile/features/auth/presentation/bloc/auth_event.dart';
import 'package:mobile/features/auth/presentation/bloc/auth_state.dart';

class MockLoginUseCase extends Mock implements LoginUseCase {}

class MockRegisterUseCase extends Mock implements RegisterUseCase {}

class MockLogoutUseCase extends Mock implements LogoutUseCase {}

class MockGetCurrentUserUseCase extends Mock implements GetCurrentUserUseCase {}

class MockCheckAuthStatusUseCase extends Mock implements CheckAuthStatusUseCase {}

const _verifiedUser = UserEntity(
  id: 1,
  name: 'John Doe',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  emailVerifiedAt: '2026-01-01T00:00:00.000Z',
);

const _unverifiedUser = UserEntity(
  id: 2,
  name: 'Jane Doe',
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  emailVerifiedAt: null,
);

const _requiresVerificationUser = UserEntity(
  id: 0,
  name: '',
  firstName: '',
  lastName: '',
  email: '',
  requiresVerification: true,
);

void main() {
  late MockLoginUseCase mockLogin;
  late MockRegisterUseCase mockRegister;
  late MockLogoutUseCase mockLogout;
  late MockGetCurrentUserUseCase mockGetCurrentUser;
  late MockCheckAuthStatusUseCase mockCheckAuthStatus;

  setUp(() {
    mockLogin = MockLoginUseCase();
    mockRegister = MockRegisterUseCase();
    mockLogout = MockLogoutUseCase();
    mockGetCurrentUser = MockGetCurrentUserUseCase();
    mockCheckAuthStatus = MockCheckAuthStatusUseCase();
  });

  AuthBloc build() => AuthBloc(
        mockLogin,
        mockRegister,
        mockLogout,
        mockGetCurrentUser,
        mockCheckAuthStatus,
      );

  group('AuthBloc', () {
    group('AuthCheckRequested', () {
      blocTest<AuthBloc, AuthState>(
        'emits [AuthLoading, AuthAuthenticated] when token exists and user is verified',
        build: build,
        setUp: () {
          when(() => mockCheckAuthStatus())
              .thenAnswer((_) async => const Right(true));
          when(() => mockGetCurrentUser())
              .thenAnswer((_) async => const Right(_verifiedUser));
        },
        act: (bloc) => bloc.add(const AuthCheckRequested()),
        expect: () => [
          const AuthLoading(),
          const AuthAuthenticated(_verifiedUser),
        ],
      );

      blocTest<AuthBloc, AuthState>(
        'emits [AuthLoading, AuthUnauthenticated] when no token exists',
        build: build,
        setUp: () {
          when(() => mockCheckAuthStatus())
              .thenAnswer((_) async => const Right(false));
        },
        act: (bloc) => bloc.add(const AuthCheckRequested()),
        expect: () => [
          const AuthLoading(),
          const AuthUnauthenticated(),
        ],
      );

      blocTest<AuthBloc, AuthState>(
        'emits [AuthLoading, AuthNeedsVerification] when user email is not verified',
        build: build,
        setUp: () {
          when(() => mockCheckAuthStatus())
              .thenAnswer((_) async => const Right(true));
          when(() => mockGetCurrentUser())
              .thenAnswer((_) async => const Right(_unverifiedUser));
        },
        act: (bloc) => bloc.add(const AuthCheckRequested()),
        expect: () => [
          const AuthLoading(),
          const AuthNeedsVerification(),
        ],
      );

      blocTest<AuthBloc, AuthState>(
        'emits [AuthLoading, AuthUnauthenticated] when checkAuthStatus returns failure',
        build: build,
        setUp: () {
          when(() => mockCheckAuthStatus()).thenAnswer(
            (_) async =>
                const Left(ServerFailure('Token check failed')),
          );
        },
        act: (bloc) => bloc.add(const AuthCheckRequested()),
        expect: () => [
          const AuthLoading(),
          const AuthUnauthenticated(),
        ],
      );

      blocTest<AuthBloc, AuthState>(
        'emits [AuthLoading, AuthUnauthenticated] when getCurrentUser returns failure',
        build: build,
        setUp: () {
          when(() => mockCheckAuthStatus())
              .thenAnswer((_) async => const Right(true));
          when(() => mockGetCurrentUser()).thenAnswer(
            (_) async => const Left(AuthFailure('Token expired')),
          );
        },
        act: (bloc) => bloc.add(const AuthCheckRequested()),
        expect: () => [
          const AuthLoading(),
          const AuthUnauthenticated(),
        ],
      );
    });

    group('AuthLoginRequested', () {
      blocTest<AuthBloc, AuthState>(
        'emits [AuthLoading, AuthAuthenticated] on successful login with verified user',
        build: build,
        setUp: () {
          when(() => mockLogin('john@example.com', 'password123'))
              .thenAnswer((_) async => const Right(_verifiedUser));
        },
        act: (bloc) => bloc.add(const AuthLoginRequested(
          email: 'john@example.com',
          password: 'password123',
        )),
        expect: () => [
          const AuthLoading(),
          const AuthAuthenticated(_verifiedUser),
        ],
      );

      blocTest<AuthBloc, AuthState>(
        'emits [AuthLoading, AuthNeedsVerification] when login returns user requiring verification',
        build: build,
        setUp: () {
          when(() => mockLogin('unverified@example.com', 'password123'))
              .thenAnswer(
                  (_) async => const Right(_requiresVerificationUser));
        },
        act: (bloc) => bloc.add(const AuthLoginRequested(
          email: 'unverified@example.com',
          password: 'password123',
        )),
        expect: () => [
          const AuthLoading(),
          const AuthNeedsVerification(),
        ],
      );

      blocTest<AuthBloc, AuthState>(
        'emits [AuthLoading, AuthError] on login failure',
        build: build,
        setUp: () {
          when(() => mockLogin(any(), any())).thenAnswer(
            (_) async => const Left(AuthFailure('Invalid credentials')),
          );
        },
        act: (bloc) => bloc.add(const AuthLoginRequested(
          email: 'wrong@example.com',
          password: 'wrongpass',
        )),
        expect: () => [
          const AuthLoading(),
          const AuthError('Invalid credentials'),
        ],
      );

      blocTest<AuthBloc, AuthState>(
        'emits [AuthLoading, AuthError] on network failure',
        build: build,
        setUp: () {
          when(() => mockLogin(any(), any())).thenAnswer(
            (_) async =>
                const Left(NetworkFailure('No internet connection')),
          );
        },
        act: (bloc) => bloc.add(const AuthLoginRequested(
          email: 'test@example.com',
          password: 'password123',
        )),
        expect: () => [
          const AuthLoading(),
          const AuthError('No internet connection'),
        ],
      );
    });

    group('AuthRegisterRequested', () {
      blocTest<AuthBloc, AuthState>(
        'emits [AuthLoading, AuthNeedsVerification] on successful registration',
        build: build,
        setUp: () {
          when(() => mockRegister(
                firstName: 'John',
                lastName: 'Doe',
                email: 'new@example.com',
                password: 'password123',
                passwordConfirmation: 'password123',
              )).thenAnswer((_) async => const Right(_requiresVerificationUser));
        },
        act: (bloc) => bloc.add(const AuthRegisterRequested(
          firstName: 'John',
          lastName: 'Doe',
          email: 'new@example.com',
          password: 'password123',
          passwordConfirmation: 'password123',
        )),
        expect: () => [
          const AuthLoading(),
          const AuthNeedsVerification(),
        ],
      );

      blocTest<AuthBloc, AuthState>(
        'emits [AuthLoading, AuthError] on registration failure',
        build: build,
        setUp: () {
          when(() => mockRegister(
                firstName: any(named: 'firstName'),
                lastName: any(named: 'lastName'),
                email: any(named: 'email'),
                password: any(named: 'password'),
                passwordConfirmation: any(named: 'passwordConfirmation'),
              )).thenAnswer(
            (_) async => const Left(
              ValidationFailure('Email already taken'),
            ),
          );
        },
        act: (bloc) => bloc.add(const AuthRegisterRequested(
          firstName: 'John',
          lastName: 'Doe',
          email: 'existing@example.com',
          password: 'password123',
          passwordConfirmation: 'password123',
        )),
        expect: () => [
          const AuthLoading(),
          const AuthError('Email already taken'),
        ],
      );
    });

    group('AuthLogoutRequested', () {
      blocTest<AuthBloc, AuthState>(
        'emits [AuthLoading, AuthUnauthenticated] on successful logout',
        build: build,
        setUp: () {
          when(() => mockLogout())
              .thenAnswer((_) async => const Right(null));
        },
        act: (bloc) => bloc.add(const AuthLogoutRequested()),
        expect: () => [
          const AuthLoading(),
          const AuthUnauthenticated(),
        ],
      );

      blocTest<AuthBloc, AuthState>(
        'emits [AuthLoading, AuthUnauthenticated] even when logout returns failure',
        build: build,
        setUp: () {
          when(() => mockLogout()).thenAnswer(
            (_) async => const Left(ServerFailure('Logout failed')),
          );
        },
        act: (bloc) => bloc.add(const AuthLogoutRequested()),
        // The bloc always emits AuthUnauthenticated after logout regardless of result
        expect: () => [
          const AuthLoading(),
          const AuthUnauthenticated(),
        ],
      );
    });
  });
}
