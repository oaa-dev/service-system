import 'package:json_annotation/json_annotation.dart';

part 'user_model.g.dart';

@JsonSerializable()
class UserModel {
  final int id;
  final String name;
  @JsonKey(name: 'first_name')
  final String? firstName;
  @JsonKey(name: 'last_name')
  final String? lastName;
  final String email;
  @JsonKey(name: 'email_verified_at')
  final String? emailVerifiedAt;
  final List<String> roles;
  final List<String> permissions;

  const UserModel({
    required this.id,
    required this.name,
    this.firstName,
    this.lastName,
    required this.email,
    this.emailVerifiedAt,
    this.roles = const [],
    this.permissions = const [],
  });

  factory UserModel.fromJson(Map<String, dynamic> json) =>
      _$UserModelFromJson(json);

  Map<String, dynamic> toJson() => _$UserModelToJson(this);

  bool get isVerified => emailVerifiedAt != null;
}
