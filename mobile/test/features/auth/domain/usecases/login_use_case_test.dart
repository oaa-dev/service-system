import 'package:flutter_test/flutter_test.dart';
import 'package:fpdart/fpdart.dart';
import 'package:mocktail/mocktail.dart';
import 'package:mobile/core/error/failures.dart';
import 'package:mobile/features/auth/domain/entities/user_entity.dart';
import 'package:mobile/features/auth/domain/repositories/auth_repository.dart';
import 'package:mobile/features/auth/domain/usecases/login_use_case.dart';

class MockAuthRepository extends Mock implements AuthRepository {}

void main() {
  late MockAuthRepository mockRepo;
  late LoginUseCase useCase;

  setUp(() {
    mockRepo = MockAuthRepository();
    useCase = LoginUseCase(mockRepo);
  });

  const email = 'test@example.com';
  const password = 'password123';
  const user = UserEntity(
    id: 1,
    name: 'Test User',
    firstName: 'Test',
    lastName: 'User',
    email: email,
    emailVerifiedAt: '2026-01-01T00:00:00.000Z',
  );

  group('LoginUseCase', () {
    test('calls repository.login with the provided email and password',
        () async {
      when(() => mockRepo.login(email, password))
          .thenAnswer((_) async => const Right(user));

      await useCase(email, password);

      verify(() => mockRepo.login(email, password)).called(1);
    });

    test('returns Right(UserEntity) on successful login', () async {
      when(() => mockRepo.login(email, password))
          .thenAnswer((_) async => const Right(user));

      final result = await useCase(email, password);

      expect(result.isRight(), true);
      result.fold(
        (_) => fail('Expected Right but got Left'),
        (u) => expect(u, user),
      );
    });

    test('returns Left(AuthFailure) when credentials are invalid', () async {
      when(() => mockRepo.login(email, password)).thenAnswer(
        (_) async => const Left(AuthFailure('Invalid credentials')),
      );

      final result = await useCase(email, password);

      expect(result.isLeft(), true);
      result.fold(
        (failure) {
          expect(failure, isA<AuthFailure>());
          expect(failure.message, 'Invalid credentials');
        },
        (_) => fail('Expected Left but got Right'),
      );
    });

    test('returns Left(NetworkFailure) on network error', () async {
      when(() => mockRepo.login(any(), any())).thenAnswer(
        (_) async =>
            const Left(NetworkFailure('No internet connection')),
      );

      final result = await useCase(email, password);

      expect(result.isLeft(), true);
      result.fold(
        (failure) => expect(failure, isA<NetworkFailure>()),
        (_) => fail('Expected Left but got Right'),
      );
    });

    test('returns Left(ServerFailure) on server error', () async {
      when(() => mockRepo.login(any(), any())).thenAnswer(
        (_) async => const Left(ServerFailure('Internal server error',
            statusCode: 500)),
      );

      final result = await useCase(email, password);

      expect(result.isLeft(), true);
      result.fold(
        (failure) {
          expect(failure, isA<ServerFailure>());
          expect((failure as ServerFailure).statusCode, 500);
        },
        (_) => fail('Expected Left but got Right'),
      );
    });

    test(
        'returns Right with requiresVerification=true when user needs email verification',
        () async {
      const unverifiedUser = UserEntity(
        id: 2,
        name: 'New User',
        firstName: 'New',
        lastName: 'User',
        email: 'new@example.com',
        requiresVerification: true,
      );

      when(() => mockRepo.login(email, password))
          .thenAnswer((_) async => const Right(unverifiedUser));

      final result = await useCase(email, password);

      expect(result.isRight(), true);
      result.fold(
        (_) => fail('Expected Right but got Left'),
        (u) {
          expect(u.requiresVerification, true);
          expect(u.isVerified, false);
        },
      );
    });
  });
}
