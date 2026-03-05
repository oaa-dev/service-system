import 'package:json_annotation/json_annotation.dart';
import 'user_model.dart';

part 'auth_token_model.g.dart';

@JsonSerializable()
class AuthTokenModel {
  @JsonKey(name: 'access_token')
  final String accessToken;
  @JsonKey(name: 'token_type')
  final String tokenType;
  @JsonKey(name: 'requires_verification')
  final bool requiresVerification;
  final UserModel? user;

  const AuthTokenModel({
    required this.accessToken,
    required this.tokenType,
    this.requiresVerification = false,
    this.user,
  });

  factory AuthTokenModel.fromJson(Map<String, dynamic> json) =>
      _$AuthTokenModelFromJson(json);

  Map<String, dynamic> toJson() => _$AuthTokenModelToJson(this);
}
