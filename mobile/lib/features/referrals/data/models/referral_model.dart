import 'package:json_annotation/json_annotation.dart';

part 'referral_model.g.dart';

@JsonSerializable()
class ReferralModel {
  final int id;
  final String status;
  @JsonKey(name: 'created_at')
  final String createdAt;
  final Map<String, dynamic>? referrer;
  final Map<String, dynamic>? referee;
  final Map<String, dynamic>? merchant;

  const ReferralModel({
    required this.id,
    required this.status,
    required this.createdAt,
    this.referrer,
    this.referee,
    this.merchant,
  });

  factory ReferralModel.fromJson(Map<String, dynamic> json) =>
      _$ReferralModelFromJson(json);

  Map<String, dynamic> toJson() => _$ReferralModelToJson(this);

  String? get referrerName => referrer?['name'] as String?;

  String? get refereeName => referee?['name'] as String?;

  String? get merchantName => merchant?['name'] as String?;
}
