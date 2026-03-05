import 'package:bloc_test/bloc_test.dart';
import 'package:fpdart/fpdart.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:mobile/core/error/failures.dart';
import 'package:mobile/features/auth/domain/repositories/auth_repository.dart';
import 'package:mobile/features/auth/domain/usecases/get_verification_status_use_case.dart';
import 'package:mobile/features/auth/domain/usecases/resend_otp_use_case.dart';
import 'package:mobile/features/auth/domain/usecases/verify_otp_use_case.dart';
import 'package:mobile/features/auth/presentation/bloc/otp_bloc.dart';
import 'package:mobile/features/auth/presentation/bloc/otp_event.dart';
import 'package:mobile/features/auth/presentation/bloc/otp_state.dart';

class MockVerifyOtpUseCase extends Mock implements VerifyOtpUseCase {}

class MockResendOtpUseCase extends Mock implements ResendOtpUseCase {}

class MockGetVerificationStatusUseCase extends Mock
    implements GetVerificationStatusUseCase {}

void main() {
  late MockVerifyOtpUseCase mockVerify;
  late MockResendOtpUseCase mockResend;
  late MockGetVerificationStatusUseCase mockGetStatus;

  setUp(() {
    mockVerify = MockVerifyOtpUseCase();
    mockResend = MockResendOtpUseCase();
    mockGetStatus = MockGetVerificationStatusUseCase();
  });

  OtpBloc build() => OtpBloc(mockVerify, mockResend, mockGetStatus);

  group('OtpBloc', () {
    group('OtpSubmitted', () {
      blocTest<OtpBloc, OtpState>(
        'emits [OtpLoading, OtpSuccess] on valid OTP',
        build: build,
        setUp: () {
          when(() => mockVerify('123456'))
              .thenAnswer((_) async => const Right(null));
        },
        act: (bloc) => bloc.add(const OtpSubmitted('123456')),
        expect: () => [
          const OtpLoading(),
          const OtpSuccess(),
        ],
      );

      blocTest<OtpBloc, OtpState>(
        'emits [OtpLoading, OtpError] on invalid OTP',
        build: build,
        setUp: () {
          when(() => mockVerify(any())).thenAnswer(
            (_) async => const Left(ServerFailure('Invalid OTP code')),
          );
        },
        act: (bloc) => bloc.add(const OtpSubmitted('000000')),
        expect: () => [
          const OtpLoading(),
          const OtpError('Invalid OTP code'),
        ],
      );

      blocTest<OtpBloc, OtpState>(
        'emits [OtpLoading, OtpError] when OTP has expired',
        build: build,
        setUp: () {
          when(() => mockVerify(any())).thenAnswer(
            (_) async => const Left(ServerFailure('OTP has expired')),
          );
        },
        act: (bloc) => bloc.add(const OtpSubmitted('111111')),
        expect: () => [
          const OtpLoading(),
          const OtpError('OTP has expired'),
        ],
      );

      blocTest<OtpBloc, OtpState>(
        'emits [OtpLoading, OtpError] on network failure during OTP verification',
        build: build,
        setUp: () {
          when(() => mockVerify(any())).thenAnswer(
            (_) async => const Left(NetworkFailure('No internet connection')),
          );
        },
        act: (bloc) => bloc.add(const OtpSubmitted('123456')),
        expect: () => [
          const OtpLoading(),
          const OtpError('No internet connection'),
        ],
      );
    });

    group('OtpResendRequested', () {
      blocTest<OtpBloc, OtpState>(
        'emits [OtpLoading, OtpResent] followed by OtpCooldown ticks on successful resend',
        build: build,
        setUp: () {
          when(() => mockResend())
              .thenAnswer((_) async => const Right(null));
        },
        act: (bloc) => bloc.add(const OtpResendRequested()),
        // We only assert the first two states; OtpCooldown ticks arrive
        // asynchronously from the internal timer and are not asserted here.
        // The `skip` parameter is left at default (0) and we verify via
        // `verify` that resend was called exactly once.
        expect: () => [const OtpLoading(), const OtpResent()],
        verify: (_) => verify(() => mockResend()).called(1),
      );

      blocTest<OtpBloc, OtpState>(
        'emits [OtpLoading, OtpError] when resend fails',
        build: build,
        setUp: () {
          when(() => mockResend()).thenAnswer(
            (_) async =>
                const Left(ServerFailure('Too many resend attempts')),
          );
        },
        act: (bloc) => bloc.add(const OtpResendRequested()),
        expect: () => [
          const OtpLoading(),
          const OtpError('Too many resend attempts'),
        ],
      );

      blocTest<OtpBloc, OtpState>(
        'emits [OtpLoading, OtpError] on network failure during resend',
        build: build,
        setUp: () {
          when(() => mockResend()).thenAnswer(
            (_) async => const Left(NetworkFailure('No internet connection')),
          );
        },
        act: (bloc) => bloc.add(const OtpResendRequested()),
        expect: () => [
          const OtpLoading(),
          const OtpError('No internet connection'),
        ],
      );
    });

    group('OtpStatusChecked', () {
      blocTest<OtpBloc, OtpState>(
        'emits nothing when status check succeeds with no cooldown',
        build: build,
        setUp: () {
          when(() => mockGetStatus()).thenAnswer(
            (_) async => const Right(VerificationStatus(
              isVerified: false,
              canResend: true,
              cooldownSeconds: 0,
            )),
          );
        },
        act: (bloc) => bloc.add(const OtpStatusChecked()),
        expect: () => [],
      );

      blocTest<OtpBloc, OtpState>(
        'emits nothing when status check returns failure (silently ignored)',
        build: build,
        setUp: () {
          when(() => mockGetStatus()).thenAnswer(
            (_) async => const Left(ServerFailure('Status unavailable')),
          );
        },
        act: (bloc) => bloc.add(const OtpStatusChecked()),
        expect: () => [],
      );
    });
  });
}
