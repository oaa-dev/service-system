import 'package:equatable/equatable.dart';

class MessageEntity extends Equatable {
  final int id;
  final String body;
  final int senderId;
  final String senderName;
  final String? senderAvatar;
  final String? readAt;
  final String createdAt;

  const MessageEntity({
    required this.id,
    required this.body,
    required this.senderId,
    required this.senderName,
    this.senderAvatar,
    this.readAt,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [
        id, body, senderId, senderName,
        senderAvatar, readAt, createdAt,
      ];
}
