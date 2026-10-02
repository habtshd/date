import 'interest.dart';
import 'profile_photo.dart';

enum Gender {
  male,
  female,
  other;

  String toBackend() => name.toUpperCase();

  static Gender fromBackend(String? value) {
    switch (value?.toUpperCase()) {
      case 'MALE':
        return Gender.male;
      case 'FEMALE':
        return Gender.female;
      case 'OTHER':
      default:
        return Gender.other;
    }
  }

  String get displayName {
    switch (this) {
      case Gender.male:
        return 'Male';
      case Gender.female:
        return 'Female';
      case Gender.other:
        return 'Other';
    }
  }
}

enum RelationshipGoal {
  marriage,
  seriousRelationship,
  dating,
  gettingToKnow,
  friendship;

  String toBackend() {
    switch (this) {
      case RelationshipGoal.marriage:
        return 'MARRIAGE';
      case RelationshipGoal.seriousRelationship:
        return 'SERIOUS_RELATIONSHIP';
      case RelationshipGoal.dating:
        return 'DATING';
      case RelationshipGoal.gettingToKnow:
        return 'GETTING_TO_KNOW';
      case RelationshipGoal.friendship:
        return 'FRIENDSHIP';
    }
  }

  static RelationshipGoal fromBackend(String? value) {
    switch (value?.toUpperCase()) {
      case 'MARRIAGE':
        return RelationshipGoal.marriage;
      case 'SERIOUS_RELATIONSHIP':
      case 'SERIOUS':
        return RelationshipGoal.seriousRelationship;
      case 'DATING':
        return RelationshipGoal.dating;
      case 'GETTING_TO_KNOW':
        return RelationshipGoal.gettingToKnow;
      case 'FRIENDSHIP':
      default:
        return RelationshipGoal.friendship;
    }
  }

  String get displayName {
    switch (this) {
      case RelationshipGoal.marriage:
        return 'Marriage / Long-term';
      case RelationshipGoal.seriousRelationship:
        return 'Serious Relationship';
      case RelationshipGoal.dating:
        return 'Dating';
      case RelationshipGoal.gettingToKnow:
        return 'Getting to Know Someone';
      case RelationshipGoal.friendship:
        return 'Friendship';
    }
  }
}

class UserProfile {
  final String? id;
  final String firstName;
  final DateTime dateOfBirth;
  final Gender gender;
  final String city;
  final String? bio;
  final RelationshipGoal relationshipGoal;
  final List<Interest> interests;
  final List<ProfilePhoto> photos;

  const UserProfile({
    this.id,
    required this.firstName,
    required this.dateOfBirth,
    required this.gender,
    required this.city,
    this.bio,
    this.relationshipGoal = RelationshipGoal.marriage,
    this.interests = const [],
    this.photos = const [],
  });

  int get age {
    final now = DateTime.now();
    int calculated = now.year - dateOfBirth.year;
    if (now.month < dateOfBirth.month ||
        (now.month == dateOfBirth.month && now.day < dateOfBirth.day)) {
      calculated--;
    }
    return calculated;
  }

  bool get isAdult => age >= 18;

  String? get primaryPhotoUrl {
    final primary = photos.where((p) => p.isPrimary).toList();
    if (primary.isNotEmpty) return primary.first.url;
    if (photos.isNotEmpty) return photos.first.url;
    return null;
  }

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    final rawInterests = json['interests'];
    List<Interest> parsedInterests = [];
    if (rawInterests is List) {
      parsedInterests = rawInterests
          .map((item) => item is Map<String, dynamic>
              ? Interest.fromJson(item)
              : Interest(id: item.toString(), name: item.toString()))
          .toList();
    }

    final rawPhotos = json['photos'];
    List<ProfilePhoto> parsedPhotos = [];
    if (rawPhotos is List) {
      parsedPhotos = rawPhotos
          .map((item) => ProfilePhoto.fromJson(item as Map<String, dynamic>))
          .toList();
    }

    return UserProfile(
      id: json['id']?.toString(),
      firstName: json['firstName']?.toString() ?? '',
      dateOfBirth: DateTime.tryParse(json['dateOfBirth']?.toString() ?? '') ??
          DateTime(2000, 1, 1),
      gender: Gender.fromBackend(json['gender']?.toString()),
      city: json['city']?.toString() ?? 'Addis Ababa',
      bio: json['bio']?.toString(),
      relationshipGoal:
          RelationshipGoal.fromBackend(json['relationshipGoal']?.toString()),
      interests: parsedInterests,
      photos: parsedPhotos,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'firstName': firstName,
      'dateOfBirth': dateOfBirth.toIso8601String().split('T').first,
      'gender': gender.toBackend(),
      'city': city,
      if (bio != null) 'bio': bio,
      'relationshipGoal': relationshipGoal.toBackend(),
    };
  }

  UserProfile copyWith({
    String? id,
    String? firstName,
    DateTime? dateOfBirth,
    Gender? gender,
    String? city,
    String? bio,
    RelationshipGoal? relationshipGoal,
    List<Interest>? interests,
    List<ProfilePhoto>? photos,
  }) {
    return UserProfile(
      id: id ?? this.id,
      firstName: firstName ?? this.firstName,
      dateOfBirth: dateOfBirth ?? this.dateOfBirth,
      gender: gender ?? this.gender,
      city: city ?? this.city,
      bio: bio ?? this.bio,
      relationshipGoal: relationshipGoal ?? this.relationshipGoal,
      interests: interests ?? this.interests,
      photos: photos ?? this.photos,
    );
  }
}
