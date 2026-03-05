import 'package:equatable/equatable.dart';

sealed class OtpState extends Equatable {
  const OtpState();

  @override
  List<Object?> get props => [];
}

class OtpInitial extends OtpState {
  const OtpInitial();
}

class OtpLoading extends OtpState {
  const OtpLoading();
}

class OtpSuccess extends OtpState {
  const OtpSuccess();
}

class OtpError extends OtpState {
  final String message;

  const OtpError(this.message);

  @override
  List<Object?> get props => [message];
}

class OtpResent extends OtpState {
  const OtpResent();
}

class OtpCooldown extends OtpState {
  final int secondsRemaining;

  const OtpCooldown(this.secondsRemaining);

  @override
  List<Object?> get props => [secondsRemaining];
}
