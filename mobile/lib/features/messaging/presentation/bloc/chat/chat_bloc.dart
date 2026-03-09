import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';
import '../../../domain/usecases/get_messages_use_case.dart';
import '../../../domain/usecases/send_message_use_case.dart';
import '../../../domain/usecases/mark_conversation_read_use_case.dart';
import 'chat_event.dart';
import 'chat_state.dart';

@injectable
class ChatBloc extends Bloc<ChatEvent, ChatState> {
  final GetMessagesUseCase _getMessages;
  final SendMessageUseCase _sendMessage;
  final MarkConversationReadUseCase _markAsRead;
  Timer? _pollTimer;

  ChatBloc(this._getMessages, this._sendMessage, this._markAsRead)
      : super(const ChatState()) {
    on<LoadMessagesEvent>(_onLoad);
    on<SendMessageEvent>(_onSend);
    on<PollMessagesEvent>(_onPoll);
    on<StopPollingEvent>(_onStopPolling);
  }

  Future<void> _onLoad(
      LoadMessagesEvent event, Emitter<ChatState> emit) async {
    emit(state.copyWith(
      type: event.type,
      entityId: event.entityId,
      currentUserId: event.currentUserId,
      isLoading: true,
    ));

    final result = await _getMessages(event.type, event.entityId);
    result.fold(
      (failure) => emit(state.copyWith(isLoading: false, error: failure.message)),
      (messages) {
        emit(state.copyWith(isLoading: false, messages: messages));
        // Mark as read after loading
        _markAsRead(event.type, event.entityId);
      },
    );

    // Start polling
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      add(const PollMessagesEvent());
    });
  }

  Future<void> _onPoll(
      PollMessagesEvent event, Emitter<ChatState> emit) async {
    if (state.type.isEmpty) return;

    final result = await _getMessages(state.type, state.entityId);
    result.fold(
      (_) {}, // Silently ignore polling errors
      (newMessages) {
        // Merge: use new messages, dedup by id
        final existingIds = state.messages.map((m) => m.id).toSet();
        final hasNew = newMessages.any((m) => !existingIds.contains(m.id));
        if (hasNew || newMessages.length != state.messages.length) {
          emit(state.copyWith(messages: newMessages));
          // Mark as read if there are new messages
          _markAsRead(state.type, state.entityId);
        }
      },
    );
  }

  Future<void> _onSend(
      SendMessageEvent event, Emitter<ChatState> emit) async {
    if (state.type.isEmpty) return;

    emit(state.copyWith(isSending: true));
    final result = await _sendMessage(state.type, state.entityId, event.body);
    result.fold(
      (failure) => emit(state.copyWith(isSending: false, error: failure.message)),
      (message) {
        final updatedMessages = [...state.messages, message];
        emit(state.copyWith(isSending: false, messages: updatedMessages));
      },
    );
  }

  void _onStopPolling(StopPollingEvent event, Emitter<ChatState> emit) {
    _pollTimer?.cancel();
    _pollTimer = null;
  }

  @override
  Future<void> close() {
    _pollTimer?.cancel();
    return super.close();
  }
}
