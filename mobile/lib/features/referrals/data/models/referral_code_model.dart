import 'package:json_annotation/json_annotation.dart';

part 'referral_code_model.g.dart';

@JsonSerializable()
class ReferralCodeModel {
  final int id;
  final String code;
  @JsonKey(name: 'uses_count')
  final int? usesCount;
  @JsonKey(name: 'expires_at')
  final String? expiresAt;
  @JsonKey(name: 'created_at')
  final String createdAt;
  final Map<String, dynamic>? merchant;

  const ReferralCodeModel({
    required this.id,
    required this.code,
    this.usesCount,
    this.expiresAt,
    required this.createdAt,
    this.merchant,
  });

  factory ReferralCodeModel.fromJson(Map<String, dynamic> json) =>
      _$ReferralCodeModelFromJson(json);

  Map<String, dynamic> toJson() => _$ReferralCodeModelToJson(this);

  String? get merchantName => merchant?['name'] as String?;

  int? get merchantId => merchant?['id'] as int?;
}
