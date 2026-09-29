class DiscoveryProfile {
  final String userId;
  final String firstName;
  final int age;
  final String city;
  final String? bio;
  final String relationshipGoal;
  final List<String> interests;
  final List<String> photos;
  final bool isVerified;
  final String? blurPreviewUrl;

  const DiscoveryProfile({
    required this.userId,
    required this.firstName,
    required this.age,
    required this.city,
    this.bio,
    this.relationshipGoal = 'MARRIAGE',
    this.interests = const [],
    this.photos = const [],
    this.isVerified = true,
    this.blurPreviewUrl,
  });

  String? get primaryPhotoUrl => photos.isNotEmpty ? photos.first : null;

  factory DiscoveryProfile.fromJson(Map<String, dynamic> json) {
    var rawInterests = json['interests'];
    List<String> parsedInterests = [];
    if (rawInterests is List) {
      parsedInterests = rawInterests
          .map((i) => i is Map ? i['name']?.toString() ?? '' : i.toString())
          .where((s) => s.isNotEmpty)
          .toList();
    }

    var rawPhotos = json['photos'];
    List<String> parsedPhotos = [];
    if (rawPhotos is List) {
      parsedPhotos = rawPhotos
          .map((p) => p is Map ? p['url']?.toString() ?? '' : p.toString())
          .where((s) => s.isNotEmpty)
          .toList();
    }

    return DiscoveryProfile(
      userId: json['userId']?.toString() ?? json['id']?.toString() ?? '',
      firstName: json['firstName']?.toString() ?? 'Anonymous',
      age: (json['age'] is num) ? (json['age'] as num).toInt() : 25,
      city: json['city']?.toString() ?? 'Addis Ababa',
      bio: json['bio']?.toString(),
      relationshipGoal: json['relationshipGoal']?.toString() ?? 'MARRIAGE',
      interests: parsedInterests,
      photos: parsedPhotos,
      isVerified: json['isVerified'] == true || json['verificationStatus'] == 'VERIFIED',
      blurPreviewUrl: json['blurPreviewUrl']?.toString(),
    );
  }
}

class LikeResult {
  final bool liked;
  final bool matched;
  final String? matchId;
  final String? conversationId;

  const LikeResult({
    required this.liked,
    this.matched = false,
    this.matchId,
    this.conversationId,
  });

  factory LikeResult.fromJson(Map<String, dynamic> json) {
    return LikeResult(
      liked: json['liked'] == true,
      matched: json['matched'] == true,
      matchId: json['matchId']?.toString(),
      conversationId: json['conversationId']?.toString(),
    );
  }
}
