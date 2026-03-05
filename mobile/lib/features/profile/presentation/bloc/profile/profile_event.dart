import 'package:equatable/equatable.dart';

sealed class ProfileEvent extends Equatable {
  const ProfileEvent();

  @override
  List<Object?> get props => [];
}

class LoadProfileEvent extends ProfileEvent {
  const LoadProfileEvent();
}

class UpdateProfileEvent extends ProfileEvent {
  final String? firstName;
  final String? lastName;
  final String? phone;
  final String? bio;

  const UpdateProfileEvent({
    this.firstName,
    this.lastName,
    this.phone,
    this.bio,
  });

  @override
  List<Object?> get props => [firstName, lastName, phone, bio];
}

class UploadAvatarEvent extends ProfileEvent {
  final String filePath;

  const UploadAvatarEvent(this.filePath);

  @override
  List<Object?> get props => [filePath];
}

class DeleteAvatarEvent extends ProfileEvent {
  const DeleteAvatarEvent();
}

class ChangePasswordEvent extends ProfileEvent {
  final String currentPassword;
  final String password;
  final String passwordConfirmation;

  const ChangePasswordEvent({
    required this.currentPassword,
    required this.password,
    required this.passwordConfirmation,
  });

  @override
  List<Object?> get props => [currentPassword, password, passwordConfirmation];
}

class LoadPaymentMethodsEvent extends ProfileEvent {
  const LoadPaymentMethodsEvent();
}

class UpdatePaymentPreferenceEvent extends ProfileEvent {
  final int paymentMethodId;

  const UpdatePaymentPreferenceEvent(this.paymentMethodId);

  @override
  List<Object?> get props => [paymentMethodId];
}

class LogoutEvent extends ProfileEvent {
  const LogoutEvent();
}
