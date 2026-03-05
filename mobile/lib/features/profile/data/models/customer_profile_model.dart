import 'package:json_annotation/json_annotation.dart';

part 'customer_profile_model.g.dart';

@JsonSerializable()
class CustomerProfileModel {
  final int id;
  @JsonKey(name: 'first_name')
  final String firstName;
  @JsonKey(name: 'last_name')
  final String lastName;
  final String name;
  final String email;
  @JsonKey(name: 'email_verified_at')
  final String? emailVerifiedAt;
  final List<String> roles;
  final UserProfileModel? profile;
  final CustomerDataModel? customer;

  const CustomerProfileModel({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.name,
    required this.email,
    this.emailVerifiedAt,
    this.roles = const [],
    this.profile,
    this.customer,
  });

  bool get isEmailVerified => emailVerifiedAt != null;

  factory CustomerProfileModel.fromJson(Map<String, dynamic> json) =>
      _$CustomerProfileModelFromJson(json);

  Map<String, dynamic> toJson() => _$CustomerProfileModelToJson(this);
}

@JsonSerializable()
class UserProfileModel {
  final String? phone;
  final String? bio;
  @JsonKey(name: 'avatar_url')
  final String? avatarUrl;
  @JsonKey(name: 'identity_status')
  final String? identityStatus;

  const UserProfileModel({
    this.phone,
    this.bio,
    this.avatarUrl,
    this.identityStatus,
  });

  factory UserProfileModel.fromJson(Map<String, dynamic> json) =>
      _$UserProfileModelFromJson(json);

  Map<String, dynamic> toJson() => _$UserProfileModelToJson(this);
}

@JsonSerializable()
class CustomerDataModel {
  final int id;
  @JsonKey(name: 'preferred_payment_method_id')
  final int? preferredPaymentMethodId;

  const CustomerDataModel({
    required this.id,
    this.preferredPaymentMethodId,
  });

  factory CustomerDataModel.fromJson(Map<String, dynamic> json) =>
      _$CustomerDataModelFromJson(json);

  Map<String, dynamic> toJson() => _$CustomerDataModelToJson(this);
}
