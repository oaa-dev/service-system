import 'package:equatable/equatable.dart';

sealed class ChatEvent extends Equatable {
  const ChatEvent();
  @override
  List<Object?> get props => [];
}

class LoadMessagesEvent extends ChatEvent {
  final String type;
  final int entityId;
  final int currentUserId;
  const LoadMessagesEvent({
    required this.type,
    required this.entityId,
    required this.currentUserId,
  });
  @override
  List<Object?> get props => [type, entityId, currentUserId];
}

class SendMessageEvent extends ChatEvent {
  final String body;
  const SendMessageEvent(this.body);
  @override
  List<Object?> get props => [body];
}

class PollMessagesEvent extends ChatEvent {
  const PollMessagesEvent();
}

class StopPollingEvent extends ChatEvent {
  const StopPollingEvent();
}
