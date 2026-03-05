import 'package:equatable/equatable.dart';

class CustomerProfileEntity extends Equatable {
  final int id;
  final String firstName;
  final String lastName;
  final String name;
  final String email;
  final bool isEmailVerified;
  final String? phone;
  final String? bio;
  final String? avatarUrl;
  final String identityStatus;
  final int? preferredPaymentMethodId;

  const CustomerProfileEntity({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.name,
    required this.email,
    required this.isEmailVerified,
    this.phone,
    this.bio,
    this.avatarUrl,
    this.identityStatus = 'none',
    this.preferredPaymentMethodId,
  });

  CustomerProfileEntity copyWith({
    int? id,
    String? firstName,
    String? lastName,
    String? name,
    String? email,
    bool? isEmailVerified,
    String? phone,
    String? bio,
    String? avatarUrl,
    String? identityStatus,
    int? preferredPaymentMethodId,
  }) {
    return CustomerProfileEntity(
      id: id ?? this.id,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      name: name ?? this.name,
      email: email ?? this.email,
      isEmailVerified: isEmailVerified ?? this.isEmailVerified,
      phone: phone ?? this.phone,
      bio: bio ?? this.bio,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      identityStatus: identityStatus ?? this.identityStatus,
      preferredPaymentMethodId:
          preferredPaymentMethodId ?? this.preferredPaymentMethodId,
    );
  }

  @override
  List<Object?> get props => [
        id,
        firstName,
        lastName,
        name,
        email,
        isEmailVerified,
        phone,
        bio,
        avatarUrl,
        identityStatus,
        preferredPaymentMethodId,
      ];
}
