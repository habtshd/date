class MessageModel {
  final String id;
  final String conversationId;
  final String senderId;
  final String text;
  final DateTime createdAt;
  final bool isDelivered;
  final bool isRead;

  const MessageModel({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.text,
    required this.createdAt,
    this.isDelivered = true,
    this.isRead = false,
  });

  bool isOutgoing(String currentUserId) => senderId == currentUserId;

  factory MessageModel.fromJson(Map<String, dynamic> json) {
    return MessageModel(
      id: json['id']?.toString() ?? '',
      conversationId: json['conversationId']?.toString() ?? '',
      senderId: json['senderId']?.toString() ?? '',
      text: json['text']?.toString() ?? json['content']?.toString() ?? '',
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
      isDelivered: json['isDelivered'] != false,
      isRead: json['isRead'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'conversationId': conversationId,
      'senderId': senderId,
      'text': text,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}
