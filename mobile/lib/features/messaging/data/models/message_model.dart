import 'package:json_annotation/json_annotation.dart';

part 'message_model.g.dart';

@JsonSerializable()
class MessageModel {
  final int id;
  final String body;
  @JsonKey(name: 'sender_id')
  final int senderId;
  final Map<String, dynamic>? sender;
  @JsonKey(name: 'read_at')
  final String? readAt;
  @JsonKey(name: 'created_at')
  final String createdAt;

  const MessageModel({
    required this.id,
    required this.body,
    required this.senderId,
    this.sender,
    this.readAt,
    required this.createdAt,
  });

  factory MessageModel.fromJson(Map<String, dynamic> json) =>
      _$MessageModelFromJson(json);

  Map<String, dynamic> toJson() => _$MessageModelToJson(this);

  String get senderName => (sender?['name'] as String?) ?? 'Unknown';

  String? get senderAvatar => sender?['avatar_url'] as String?;
}
