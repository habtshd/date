import 'user_profile.dart';

class Preferences {
  final int minAge;
  final int maxAge;
  final Gender? preferredGender;
  final String? preferredCity;
  final RelationshipGoal? relationshipGoal;
  final int? maxDistanceKm;

  const Preferences({
    this.minAge = 18,
    this.maxAge = 35,
    this.preferredGender,
    this.preferredCity,
    this.relationshipGoal,
    this.maxDistanceKm,
  });

  bool get isValid => minAge >= 18 && maxAge >= minAge;

  String? validate() {
    if (minAge < 18) {
      return 'Minimum age must be at least 18';
    }
    if (maxAge < minAge) {
      return 'Maximum age cannot be less than minimum age';
    }
    return null;
  }

  factory Preferences.fromJson(Map<String, dynamic> json) {
    return Preferences(
      minAge: (json['minAge'] is num) ? (json['minAge'] as num).toInt() : 18,
      maxAge: (json['maxAge'] is num) ? (json['maxAge'] as num).toInt() : 35,
      preferredGender: json['preferredGender'] != null
          ? Gender.fromBackend(json['preferredGender'].toString())
          : null,
      preferredCity: json['preferredCity']?.toString() ?? json['city']?.toString(),
      relationshipGoal: json['relationshipGoal'] != null
          ? RelationshipGoal.fromBackend(json['relationshipGoal'].toString())
          : null,
      maxDistanceKm: (json['maxDistanceKm'] is num)
          ? (json['maxDistanceKm'] as num).toInt()
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'minAge': minAge,
      'maxAge': maxAge,
      if (preferredGender != null) 'preferredGender': preferredGender!.toBackend(),
      if (preferredCity != null) 'preferredCity': preferredCity,
      if (relationshipGoal != null)
        'relationshipGoal': relationshipGoal!.toBackend(),
      if (maxDistanceKm != null) 'maxDistanceKm': maxDistanceKm,
    };
  }

  Preferences copyWith({
    int? minAge,
    int? maxAge,
    Gender? preferredGender,
    String? preferredCity,
    RelationshipGoal? relationshipGoal,
    int? maxDistanceKm,
  }) {
    return Preferences(
      minAge: minAge ?? this.minAge,
      maxAge: maxAge ?? this.maxAge,
      preferredGender: preferredGender ?? this.preferredGender,
      preferredCity: preferredCity ?? this.preferredCity,
      relationshipGoal: relationshipGoal ?? this.relationshipGoal,
      maxDistanceKm: maxDistanceKm ?? this.maxDistanceKm,
    );
  }
}
