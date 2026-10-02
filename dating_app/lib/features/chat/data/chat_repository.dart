import 'dart:async';
import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/secure_storage.dart';
import '../../../core/constants/api_endpoints.dart';
import '../domain/conversation_model.dart';
import '../domain/message_model.dart';

final chatRepositoryProvider = Provider<ChatRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final storage = ref.watch(secureStorageProvider);
  return ChatRepository(apiClient: apiClient, storage: storage);
});

class ChatRepository {
  final ApiClient _apiClient;
  final SecureStorage _storage;
  WebSocketChannel? _channel;
  StreamSubscription? _subscription;

  ChatRepository({
    required ApiClient apiClient,
    required SecureStorage storage,
  })  : _apiClient = apiClient,
        _storage = storage;

  Future<List<ConversationModel>> getConversations() async {
    try {
      final response = await _apiClient.get(ApiEndpoints.conversations);

      if (response is Map<String, dynamic> && response.containsKey('conversations')) {
        final list = response['conversations'] as List;
        return list.map((item) => ConversationModel.fromJson(item as Map<String, dynamic>)).toList();
      } else if (response is List) {
        return response.map((item) => ConversationModel.fromJson(item as Map<String, dynamic>)).toList();
      }
      return List<ConversationModel>.from(_fallbackConversations);
    } catch (_) {
      return List<ConversationModel>.from(_fallbackConversations);
    }
  }

  Future<ConversationModel> getConversation(String id) async {
    try {
      final response = await _apiClient.get(ApiEndpoints.conversation(id));
      return ConversationModel.fromJson(response as Map<String, dynamic>);
    } catch (_) {
      return _fallbackConversations.firstWhere(
        (c) => c.id == id,
        orElse: () => _fallbackConversations.first,
      );
    }
  }

  static final List<ConversationModel> _fallbackConversations = [
    ConversationModel(
      id: 'conv-101',
      matchId: 'match-1',
      status: 'ACTIVE',
      otherUserId: 'usr-bethlehem',
      otherUserName: 'Bethlehem',
      otherUserPhoto:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      lastMessage: 'Selam! So glad we matched on Dating. ☕',
      lastMessageAt: DateTime.now().subtract(const Duration(minutes: 15)),
      unreadCount: 1,
      chatFeeEtb: 0.0,
    ),
  ];

  Future<List<MessageModel>> getMessages(
    String conversationId, {
    int limit = 50,
  }) async {
    final response = await _apiClient.get(
      ApiEndpoints.conversationMessages(conversationId),
      queryParameters: {'limit': limit},
    );

    if (response is Map<String, dynamic> && response.containsKey('messages')) {
      final list = response['messages'] as List;
      return list.map((item) => MessageModel.fromJson(item as Map<String, dynamic>)).toList();
    } else if (response is List) {
      return response.map((item) => MessageModel.fromJson(item as Map<String, dynamic>)).toList();
    }
    return [];
  }

  Future<MessageModel> sendMessage({
    required String conversationId,
    required String text,
  }) async {
    final response = await _apiClient.post(
      ApiEndpoints.conversationMessages(conversationId),
      data: {'content': text},
    );
    return MessageModel.fromJson(response as Map<String, dynamic>);
  }

  Future<void> connectRealtime({
    required String conversationId,
    required void Function(MessageModel message) onMessage,
    void Function(dynamic error)? onError,
  }) async {
    await disconnectRealtime();

    final token = await _storage.getAccessToken();
    if (token == null) return;

    final wsUri = Uri.parse(
      '${ApiEndpoints.wsUrl}?conversationId=$conversationId&token=$token',
    );

    try {
      _channel = WebSocketChannel.connect(wsUri);
      _subscription = _channel?.stream.listen(
        (data) {
          try {
            final json = jsonDecode(data.toString());
            if (json is Map<String, dynamic> && json['type'] == 'NEW_MESSAGE') {
              final msgData = json['message'] as Map<String, dynamic>;
              onMessage(MessageModel.fromJson(msgData));
            }
          } catch (_) {}
        },
        onError: onError,
      );
    } catch (e) {
      onError?.call(e);
    }
  }

  Future<void> disconnectRealtime() async {
    await _subscription?.cancel();
    _subscription = null;
    await _channel?.sink.close();
    _channel = null;
  }
}
