import 'package:json_annotation/json_annotation.dart';

part 'verification_status_model.g.dart';

@JsonSerializable()
class VerificationStatusModel {
  @JsonKey(name: 'is_verified')
  final bool isVerified;
  @JsonKey(name: 'can_resend')
  final bool canResend;
  @JsonKey(name: 'locked_until')
  final String? lockedUntil;
  @JsonKey(name: 'expires_at')
  final String? expiresAt;

  const VerificationStatusModel({
    required this.isVerified,
    required this.canResend,
    this.lockedUntil,
    this.expiresAt,
  });

  factory VerificationStatusModel.fromJson(Map<String, dynamic> json) =>
      _$VerificationStatusModelFromJson(json);

  Map<String, dynamic> toJson() => _$VerificationStatusModelToJson(this);

  /// Seconds remaining until resend is allowed (0 if can resend now)
  int get cooldownSeconds {
    if (canResend || lockedUntil == null) return 0;
    final locked = DateTime.tryParse(lockedUntil!);
    if (locked == null) return 0;
    final remaining = locked.difference(DateTime.now()).inSeconds;
    return remaining < 0 ? 0 : remaining;
  }
}
