import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:get_it/get_it.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../bloc/chat/chat_bloc.dart';
import '../bloc/chat/chat_event.dart';
import '../bloc/chat/chat_state.dart';
import 'message_bubble.dart';
import 'message_input.dart';

class ChatBottomSheet extends StatefulWidget {
  final String type;
  final int entityId;
  final int currentUserId;

  const ChatBottomSheet({
    super.key,
    required this.type,
    required this.entityId,
    required this.currentUserId,
  });

  @override
  State<ChatBottomSheet> createState() => _ChatBottomSheetState();
}

class _ChatBottomSheetState extends State<ChatBottomSheet> {
  late final ChatBloc _chatBloc;

  @override
  void initState() {
    super.initState();
    _chatBloc = GetIt.I<ChatBloc>();
    _chatBloc.add(LoadMessagesEvent(
      type: widget.type,
      entityId: widget.entityId,
      currentUserId: widget.currentUserId,
    ));
  }

  @override
  void dispose() {
    _chatBloc.add(const StopPollingEvent());
    _chatBloc.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: _chatBloc,
      child: Container(
        height: MediaQuery.of(context).size.height * 0.75,
        decoration: const BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          children: [
            _buildHeader(context),
            const Divider(height: 1, color: AppColors.grey200),
            Expanded(child: _buildMessageList()),
            _buildInput(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 12, 12, 12),
      child: Column(
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.grey300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: AppColors.primaryLight,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.chat_bubble_outline_rounded,
                  color: AppColors.primary,
                  size: 18,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Messages',
                  style: AppTypography.titleMedium,
                ),
              ),
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.close_rounded),
                iconSize: 22,
                color: AppColors.grey500,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMessageList() {
    return BlocBuilder<ChatBloc, ChatState>(
      builder: (context, state) {
        if (state.isLoading) {
          return const Center(
            child: CircularProgressIndicator(color: AppColors.primary),
          );
        }

        if (state.error != null && state.messages.isEmpty) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.error_outline_rounded, size: 48, color: AppColors.grey300),
                  const SizedBox(height: 12),
                  Text(
                    state.error!,
                    style: AppTypography.bodyMedium.copyWith(color: AppColors.grey500),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  TextButton(
                    onPressed: () => _chatBloc.add(LoadMessagesEvent(
                      type: widget.type,
                      entityId: widget.entityId,
                      currentUserId: widget.currentUserId,
                    )),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            ),
          );
        }

        if (state.messages.isEmpty) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.chat_bubble_outline_rounded, size: 48, color: AppColors.grey300),
                  const SizedBox(height: 12),
                  Text(
                    'No messages yet',
                    style: AppTypography.titleSmall.copyWith(color: AppColors.grey500),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Send a message to start the conversation',
                    style: AppTypography.bodySmall,
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          );
        }

        return ListView.builder(
          reverse: true,
          padding: const EdgeInsets.symmetric(vertical: 8),
          itemCount: state.messages.length,
          itemBuilder: (context, index) {
            // Reversed list: newest at bottom
            final message = state.messages[state.messages.length - 1 - index];
            final isMe = message.senderId == state.currentUserId;
            return MessageBubble(
              message: message,
              isMe: isMe,
            );
          },
        );
      },
    );
  }

  Widget _buildInput() {
    return BlocBuilder<ChatBloc, ChatState>(
      buildWhen: (prev, curr) => prev.isSending != curr.isSending,
      builder: (context, state) {
        return MessageInput(
          isSending: state.isSending,
          onSend: (body) => _chatBloc.add(SendMessageEvent(body)),
        );
      },
    );
  }
}
