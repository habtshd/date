import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../app/theme.dart';
import '../../../core/widgets/loading_indicator.dart';
import '../../../core/widgets/error_view.dart';
import '../data/chat_repository.dart';
import '../domain/conversation_model.dart';
import '../domain/message_model.dart';
import 'locked_conversation_screen.dart';
import '../../safety/presentation/report_dialog.dart';
import '../../auth/data/auth_repository.dart';

class ChatScreen extends ConsumerStatefulWidget {
  final String conversationId;

  const ChatScreen({
    super.key,
    required this.conversationId,
  });

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  ConversationModel? _conversation;
  List<MessageModel> _messages = [];
  bool _isLoading = true;
  String? _errorMessage;
  final _textController = TextEditingController();
  final _scrollController = ScrollController();
  bool _isSending = false;

  @override
  void initState() {
    super.initState();
    _loadConversationAndMessages();
  }

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    ref.read(chatRepositoryProvider).disconnectRealtime();
    super.dispose();
  }

  Future<void> _loadConversationAndMessages() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final repo = ref.read(chatRepositoryProvider);

    try {
      final convo = await repo.getConversation(widget.conversationId);

      if (mounted) {
        setState(() {
          _conversation = convo;
        });

        if (convo.isUnlocked) {
          final history = await repo.getMessages(widget.conversationId);
          if (mounted) {
            setState(() {
              _messages = history;
              _isLoading = false;
            });
            _connectRealtime();
          }
        } else {
          setState(() => _isLoading = false);
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  void _connectRealtime() {
    final repo = ref.read(chatRepositoryProvider);
    repo.connectRealtime(
      conversationId: widget.conversationId,
      onMessage: (newMsg) {
        if (mounted) {
          setState(() {
            _messages.insert(0, newMsg);
          });
        }
      },
    );
  }

  Future<void> _handleSendMessage() async {
    final text = _textController.text.trim();
    if (text.isEmpty || _isSending) return;

    _textController.clear();
    setState(() => _isSending = true);

    try {
      final repo = ref.read(chatRepositoryProvider);
      final sentMsg = await repo.sendMessage(
        conversationId: widget.conversationId,
        text: text,
      );

      if (mounted) {
        setState(() {
          _messages.insert(0, sentMsg);
          _isSending = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSending = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to send message: $e'),
            backgroundColor: AppTheme.accentCoral,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: LoadingIndicator(message: 'Opening conversation...'),
      );
    }

    if (_errorMessage != null) {
      return Scaffold(
        appBar: AppBar(),
        body: ErrorView(
          message: _errorMessage!,
          onRetry: _loadConversationAndMessages,
        ),
      );
    }

    if (_conversation == null) {
      return const Scaffold(
        body: ErrorView(message: 'Conversation not found.'),
      );
    }

    // If conversation is locked, display the locked payment screen
    if (_conversation!.isLocked) {
      return LockedConversationScreen(
        conversation: _conversation!,
        onUnlocked: _loadConversationAndMessages,
      );
    }

    final currentUserId = ref.watch(authStateProvider).user?.id ?? '';

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: AppTheme.darkCard,
              ),
              child: const Icon(
                Icons.person_rounded,
                size: 22,
                color: AppTheme.primaryGold,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _conversation!.otherUserName,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const Text(
                    'Active Now',
                    style: TextStyle(
                      fontSize: 11,
                      color: AppTheme.accentEmerald,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert_rounded),
            color: AppTheme.darkCard,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: const BorderSide(color: AppTheme.darkCardBorder),
            ),
            onSelected: (value) async {
              if (value == 'report') {
                await SafetyDialogs.showReportDialog(
                  context: context,
                  ref: ref,
                  reportedUserId: _conversation!.otherUserId,
                  userName: _conversation!.otherUserName,
                  conversationId: _conversation!.id,
                );
              } else if (value == 'block') {
                final blocked = await SafetyDialogs.showBlockConfirmationDialog(
                  context: context,
                  ref: ref,
                  targetUserId: _conversation!.otherUserId,
                  userName: _conversation!.otherUserName,
                );
                if (blocked && mounted) {
                  context.pop();
                }
              }
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'report',
                child: Row(
                  children: [
                    Icon(Icons.flag_outlined, color: AppTheme.textSecondary, size: 20),
                    SizedBox(width: 12),
                    Text('Report User', style: TextStyle(color: AppTheme.textPrimary)),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'block',
                child: Row(
                  children: [
                    Icon(Icons.block_rounded, color: AppTheme.accentCoral, size: 20),
                    SizedBox(width: 12),
                    Text('Block User', style: TextStyle(color: AppTheme.accentCoral)),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: _messages.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: AppTheme.primaryGold.withOpacity(0.12),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.chat_bubble_rounded,
                              color: AppTheme.primaryGold,
                              size: 32,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'Say hi to ${_conversation!.otherUserName}!',
                            style: const TextStyle(
                              color: AppTheme.textSecondary,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      controller: _scrollController,
                      reverse: true,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      itemCount: _messages.length,
                      itemBuilder: (context, index) {
                        final msg = _messages[index];
                        final isMe = msg.isOutgoing(currentUserId);
                        return _buildMessageBubble(msg, isMe);
                      },
                    ),
            ),
            _buildInputBar(),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageBubble(MessageModel msg, bool isMe) {
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.75,
        ),
        decoration: BoxDecoration(
          color: isMe ? AppTheme.primaryGold : AppTheme.darkCard,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(18),
            topRight: const Radius.circular(18),
            bottomLeft: Radius.circular(isMe ? 18 : 4),
            bottomRight: Radius.circular(isMe ? 4 : 18),
          ),
          border: isMe ? null : Border.all(color: AppTheme.darkCardBorder),
        ),
        child: Column(
          crossAxisAlignment:
              isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            Text(
              msg.text,
              style: TextStyle(
                fontSize: 15,
                color: isMe ? Colors.black : AppTheme.textPrimary,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              DateFormat('hh:mm a').format(msg.createdAt),
              style: TextStyle(
                fontSize: 10,
                color: isMe ? Colors.black54 : AppTheme.textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInputBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: const BoxDecoration(
        color: AppTheme.darkSurface,
        border: Border(top: BorderSide(color: AppTheme.darkCardBorder)),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _textController,
              textCapitalization: TextCapitalization.sentences,
              style: const TextStyle(color: AppTheme.textPrimary, fontSize: 15),
              decoration: InputDecoration(
                hintText: 'Type a message...',
                hintStyle: const TextStyle(color: AppTheme.textMuted),
                contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: BorderSide.none,
                ),
                filled: true,
                fillColor: AppTheme.inputBackground,
              ),
              onSubmitted: (_) => _handleSendMessage(),
            ),
          ),
          const SizedBox(width: 8),
          InkWell(
            onTap: _handleSendMessage,
            borderRadius: BorderRadius.circular(24),
            child: Container(
              width: 46,
              height: 46,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: [AppTheme.primaryGold, AppTheme.accentCrimson],
                ),
              ),
              child: const Icon(
                Icons.send_rounded,
                color: Colors.white,
                size: 20,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
