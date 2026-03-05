import 'package:equatable/equatable.dart';
import '../../../domain/entities/customer_profile_entity.dart';
import '../../../domain/entities/payment_method_entity.dart';

sealed class ProfileState extends Equatable {
  const ProfileState();

  @override
  List<Object?> get props => [];
}

class ProfileInitial extends ProfileState {
  const ProfileInitial();
}

class ProfileLoading extends ProfileState {
  const ProfileLoading();
}

class ProfileLoaded extends ProfileState {
  final CustomerProfileEntity profile;
  final List<PaymentMethodEntity> paymentMethods;

  /// True while a save/update mutation is in-flight (e.g. saving personal info).
  final bool isUpdating;

  const ProfileLoaded({
    required this.profile,
    this.paymentMethods = const [],
    this.isUpdating = false,
  });

  ProfileLoaded copyWith({
    CustomerProfileEntity? profile,
    List<PaymentMethodEntity>? paymentMethods,
    bool? isUpdating,
  }) {
    return ProfileLoaded(
      profile: profile ?? this.profile,
      paymentMethods: paymentMethods ?? this.paymentMethods,
      isUpdating: isUpdating ?? this.isUpdating,
    );
  }

  @override
  List<Object?> get props => [profile, paymentMethods, isUpdating];
}

class ProfileError extends ProfileState {
  final String message;

  const ProfileError(this.message);

  @override
  List<Object?> get props => [message];
}

class ProfileUpdateSuccess extends ProfileState {
  final CustomerProfileEntity profile;

  const ProfileUpdateSuccess(this.profile);

  @override
  List<Object?> get props => [profile];
}

class PasswordChangeSuccess extends ProfileState {
  const PasswordChangeSuccess();
}

class PasswordChangeError extends ProfileState {
  final String message;

  const PasswordChangeError(this.message);

  @override
  List<Object?> get props => [message];
}
