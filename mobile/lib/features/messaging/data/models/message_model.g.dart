// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'message_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

MessageModel _$MessageModelFromJson(Map<String, dynamic> json) => MessageModel(
  id: (json['id'] as num).toInt(),
  body: json['body'] as String,
  senderId: (json['sender_id'] as num).toInt(),
  sender: json['sender'] as Map<String, dynamic>?,
  readAt: json['read_at'] as String?,
  createdAt: json['created_at'] as String,
);

Map<String, dynamic> _$MessageModelToJson(MessageModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'body': instance.body,
      'sender_id': instance.senderId,
      'sender': instance.sender,
      'read_at': instance.readAt,
      'created_at': instance.createdAt,
    };
