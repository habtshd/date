class ConversationModel {
  final String id;
  final String matchId;
  final String status; // LOCKED, ACTIVE, CLOSED
  final String otherUserId;
  final String otherUserName;
  final String? otherUserPhoto;
  final String? lastMessage;
  final DateTime? lastMessageAt;
  final int unreadCount;
  final double chatFeeEtb;

  const ConversationModel({
    required this.id,
    required this.matchId,
    required this.status,
    required this.otherUserId,
    required this.otherUserName,
    this.otherUserPhoto,
    this.lastMessage,
    this.lastMessageAt,
    this.unreadCount = 0,
    this.chatFeeEtb = 50.0,
  });

  bool get isUnlocked => status == 'ACTIVE';
  bool get isLocked => status == 'LOCKED';
  bool get isClosed => status == 'CLOSED';

  factory ConversationModel.fromJson(Map<String, dynamic> json) {
    final otherUser = json['otherUser'] as Map<String, dynamic>? ?? {};
    final otherProfile = otherUser['profile'] as Map<String, dynamic>? ?? {};

    return ConversationModel(
      id: json['id']?.toString() ?? '',
      matchId: json['matchId']?.toString() ?? '',
      status: json['status']?.toString() ?? 'LOCKED',
      otherUserId: otherUser['id']?.toString() ?? json['otherUserId']?.toString() ?? '',
      otherUserName: otherProfile['firstName']?.toString() ??
          json['otherUserName']?.toString() ??
          'Chat',
      otherUserPhoto: otherProfile['primaryPhoto']?.toString() ??
          json['otherUserPhoto']?.toString(),
      lastMessage: json['lastMessage']?.toString(),
      lastMessageAt: json['lastMessageAt'] != null
          ? DateTime.tryParse(json['lastMessageAt'].toString())
          : null,
      unreadCount: (json['unreadCount'] is num) ? (json['unreadCount'] as num).toInt() : 0,
      chatFeeEtb: (json['chatFeeEtb'] is num)
          ? (json['chatFeeEtb'] as num).toDouble()
          : 50.0,
    );
  }
}
