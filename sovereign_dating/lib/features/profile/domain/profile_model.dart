class ProfilePhotoModel {
  final String id;
  final String url;
  final bool isPrimary;

  const ProfilePhotoModel({
    required this.id,
    required this.url,
    this.isPrimary = false,
  });

  factory ProfilePhotoModel.fromJson(Map<String, dynamic> json) {
    return ProfilePhotoModel(
      id: json['id']?.toString() ?? '',
      url: json['url']?.toString() ?? '',
      isPrimary: json['isPrimary'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'url': url,
      'isPrimary': isPrimary,
    };
  }
}

class UserProfileModel {
  final String? id;
  final String firstName;
  final DateTime dateOfBirth;
  final String gender; // MALE, FEMALE
  final String city;
  final String? bio;
  final String relationshipGoal; // MARRIAGE, SERIOUS, DATING, FRIENDSHIP
  final List<String> interests;
  final List<ProfilePhotoModel> photos;

  const UserProfileModel({
    this.id,
    required this.firstName,
    required this.dateOfBirth,
    required this.gender,
    required this.city,
    this.bio,
    this.relationshipGoal = 'MARRIAGE',
    this.interests = const [],
    this.photos = const [],
  });

  int get age {
    final now = DateTime.now();
    int age = now.year - dateOfBirth.year;
    if (now.month < dateOfBirth.month ||
        (now.month == dateOfBirth.month && now.day < dateOfBirth.day)) {
      age--;
    }
    return age;
  }

  String? get primaryPhotoUrl {
    final primary = photos.where((p) => p.isPrimary).toList();
    if (primary.isNotEmpty) return primary.first.url;
    if (photos.isNotEmpty) return photos.first.url;
    return null;
  }

  factory UserProfileModel.fromJson(Map<String, dynamic> json) {
    var rawInterests = json['interests'];
    List<String> parsedInterests = [];
    if (rawInterests is List) {
      parsedInterests = rawInterests
          .map((item) => item is Map ? item['name']?.toString() ?? '' : item.toString())
          .where((s) => s.isNotEmpty)
          .toList();
    }

    var rawPhotos = json['photos'];
    List<ProfilePhotoModel> parsedPhotos = [];
    if (rawPhotos is List) {
      parsedPhotos = rawPhotos
          .map((p) => ProfilePhotoModel.fromJson(p as Map<String, dynamic>))
          .toList();
    }

    return UserProfileModel(
      id: json['id']?.toString(),
      firstName: json['firstName']?.toString() ?? '',
      dateOfBirth: DateTime.tryParse(json['dateOfBirth']?.toString() ?? '') ??
          DateTime(2000, 1, 1),
      gender: json['gender']?.toString() ?? 'FEMALE',
      city: json['city']?.toString() ?? 'Addis Ababa',
      bio: json['bio']?.toString(),
      relationshipGoal: json['relationshipGoal']?.toString() ?? 'MARRIAGE',
      interests: parsedInterests,
      photos: parsedPhotos,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'firstName': firstName,
      'dateOfBirth': dateOfBirth.toIso8601String().split('T').first,
      'gender': gender,
      'city': city,
      if (bio != null) 'bio': bio,
      'relationshipGoal': relationshipGoal,
      'interests': interests,
      'photos': photos.map((p) => p.toJson()).toList(),
    };
  }
}
