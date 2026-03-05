import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';
import '../../domain/usecases/get_verification_status_use_case.dart';
import '../../domain/usecases/resend_otp_use_case.dart';
import '../../domain/usecases/verify_otp_use_case.dart';
import 'otp_event.dart';
import 'otp_state.dart';

@injectable
class OtpBloc extends Bloc<OtpEvent, OtpState> {
  final VerifyOtpUseCase _verifyOtp;
  final ResendOtpUseCase _resendOtp;
  final GetVerificationStatusUseCase _getVerificationStatus;

  Timer? _cooldownTimer;

  OtpBloc(
    this._verifyOtp,
    this._resendOtp,
    this._getVerificationStatus,
  ) : super(const OtpInitial()) {
    on<OtpSubmitted>(_onSubmitted);
    on<OtpResendRequested>(_onResendRequested);
    on<OtpStatusChecked>(_onStatusChecked);
    on<OtpCooldownTick>(_onCooldownTick);
  }

  Future<void> _onSubmitted(
    OtpSubmitted event,
    Emitter<OtpState> emit,
  ) async {
    emit(const OtpLoading());
    final result = await _verifyOtp(event.code);
    result.fold(
      (failure) => emit(OtpError(failure.message)),
      (_) => emit(const OtpSuccess()),
    );
  }

  Future<void> _onResendRequested(
    OtpResendRequested event,
    Emitter<OtpState> emit,
  ) async {
    emit(const OtpLoading());
    final result = await _resendOtp();
    result.fold(
      (failure) => emit(OtpError(failure.message)),
      (_) {
        emit(const OtpResent());
        _startCooldown(300); // 5-minute default cooldown
      },
    );
  }

  Future<void> _onStatusChecked(
    OtpStatusChecked event,
    Emitter<OtpState> emit,
  ) async {
    final result = await _getVerificationStatus();
    result.fold(
      (failure) => null, // Silently ignore status check failures
      (status) {
        if (status.cooldownSeconds > 0) {
          _startCooldown(status.cooldownSeconds);
        }
      },
    );
  }

  void _onCooldownTick(
    OtpCooldownTick event,
    Emitter<OtpState> emit,
  ) {
    if (event.secondsRemaining <= 0) {
      emit(const OtpInitial());
    } else {
      emit(OtpCooldown(event.secondsRemaining));
    }
  }

  void _startCooldown(int seconds) {
    _cooldownTimer?.cancel();
    var remaining = seconds;
    _cooldownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      remaining--;
      if (remaining <= 0) {
        timer.cancel();
      }
      if (!isClosed) add(OtpCooldownTick(remaining));
    });
  }

  @override
  Future<void> close() {
    _cooldownTimer?.cancel();
    return super.close();
  }
}
