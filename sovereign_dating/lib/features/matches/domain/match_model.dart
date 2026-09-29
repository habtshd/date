class MatchModel {
  final String id;
  final String matchedUserId;
  final String matchedUserName;
  final int matchedUserAge;
  final String? matchedUserPhoto;
  final String city;
  final String? conversationId;
  final bool isConversationUnlocked;
  final DateTime createdAt;

  const MatchModel({
    required this.id,
    required this.matchedUserId,
    required this.matchedUserName,
    required this.matchedUserAge,
    this.matchedUserPhoto,
    required this.city,
    this.conversationId,
    this.isConversationUnlocked = false,
    required this.createdAt,
  });

  factory MatchModel.fromJson(Map<String, dynamic> json) {
    final otherUser = json['otherUser'] as Map<String, dynamic>? ?? {};
    final otherProfile = otherUser['profile'] as Map<String, dynamic>? ?? {};

    return MatchModel(
      id: json['id']?.toString() ?? '',
      matchedUserId: otherUser['id']?.toString() ?? json['matchedUserId']?.toString() ?? '',
      matchedUserName: otherProfile['firstName']?.toString() ??
          json['matchedUserName']?.toString() ??
          'Match',
      matchedUserAge: (json['matchedUserAge'] is num)
          ? (json['matchedUserAge'] as num).toInt()
          : 25,
      matchedUserPhoto: otherProfile['primaryPhoto']?.toString() ??
          json['matchedUserPhoto']?.toString(),
      city: otherProfile['city']?.toString() ?? json['city']?.toString() ?? 'Addis Ababa',
      conversationId: json['conversationId']?.toString() ?? json['conversation']?['id']?.toString(),
      isConversationUnlocked: json['conversation']?['status'] == 'ACTIVE' ||
          json['isConversationUnlocked'] == true,
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
    );
  }
}
