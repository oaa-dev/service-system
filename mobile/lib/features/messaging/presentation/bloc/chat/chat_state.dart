import 'package:equatable/equatable.dart';
import '../../../domain/entities/message_entity.dart';

class ChatState extends Equatable {
  final String type;
  final int entityId;
  final int currentUserId;
  final List<MessageEntity> messages;
  final bool isLoading;
  final bool isSending;
  final String? error;

  const ChatState({
    this.type = '',
    this.entityId = 0,
    this.currentUserId = 0,
    this.messages = const [],
    this.isLoading = false,
    this.isSending = false,
    this.error,
  });

  ChatState copyWith({
    String? type,
    int? entityId,
    int? currentUserId,
    List<MessageEntity>? messages,
    bool? isLoading,
    bool? isSending,
    String? error,
  }) {
    return ChatState(
      type: type ?? this.type,
      entityId: entityId ?? this.entityId,
      currentUserId: currentUserId ?? this.currentUserId,
      messages: messages ?? this.messages,
      isLoading: isLoading ?? this.isLoading,
      isSending: isSending ?? this.isSending,
      error: error,
    );
  }

  @override
  List<Object?> get props => [
        type, entityId, currentUserId,
        messages, isLoading, isSending, error,
      ];
}
