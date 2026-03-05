import 'package:equatable/equatable.dart';

class UserEntity extends Equatable {
  final int id;
  final String name;
  final String? firstName;
  final String? lastName;
  final String email;
  final String? emailVerifiedAt;
  final List<String> roles;
  final List<String> permissions;
  final bool requiresVerification;

  const UserEntity({
    required this.id,
    required this.name,
    this.firstName,
    this.lastName,
    required this.email,
    this.emailVerifiedAt,
    this.roles = const [],
    this.permissions = const [],
    this.requiresVerification = false,
  });

  bool get isVerified => emailVerifiedAt != null;

  bool get isCustomer => roles.contains('customer');

  @override
  List<Object?> get props => [
        id,
        name,
        firstName,
        lastName,
        email,
        emailVerifiedAt,
        roles,
        permissions,
        requiresVerification,
      ];
}
