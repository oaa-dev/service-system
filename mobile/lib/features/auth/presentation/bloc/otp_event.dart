import 'package:equatable/equatable.dart';

sealed class OtpEvent extends Equatable {
  const OtpEvent();

  @override
  List<Object?> get props => [];
}

class OtpSubmitted extends OtpEvent {
  final String code;

  const OtpSubmitted(this.code);

  @override
  List<Object?> get props => [code];
}

class OtpResendRequested extends OtpEvent {
  const OtpResendRequested();
}

class OtpStatusChecked extends OtpEvent {
  const OtpStatusChecked();
}

/// Internal event dispatched by the countdown timer — not intended for external use
class OtpCooldownTick extends OtpEvent {
  final int secondsRemaining;
  const OtpCooldownTick(this.secondsRemaining);

  @override
  List<Object?> get props => [secondsRemaining];
}
