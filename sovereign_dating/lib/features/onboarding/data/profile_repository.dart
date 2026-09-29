import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../domain/user_profile.dart';
import '../domain/preferences.dart';
import '../domain/interest.dart';
import '../domain/profile_photo.dart';
import 'profile_api.dart';

final profileApiProvider = Provider<ProfileApi>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return ProfileApi(apiClient.dio);
});

final profileRepositoryProvider = Provider<ProfileRepository>((ref) {
  final api = ref.watch(profileApiProvider);
  return ProfileRepository(api);
});

class OnboardingProgress {
  final bool hasProfile;
  final bool hasPreferences;
  final bool hasInterests;
  final bool hasPrimaryPhoto;
  final String nextRoute;

  const OnboardingProgress({
    required this.hasProfile,
    required this.hasPreferences,
    required this.hasInterests,
    required this.hasPrimaryPhoto,
    required this.nextRoute,
  });

  bool get isComplete =>
      hasProfile && hasPreferences && hasInterests && hasPrimaryPhoto;
}

class ProfileRepository {
  final ProfileApi _api;

  ProfileRepository(this._api);

  Future<UserProfile?> fetchProfile() async {
    try {
      final json = await _api.getProfile();
      if (json.isEmpty || json['firstName'] == null) return null;
      return UserProfile.fromJson(json);
    } catch (_) {
      return null;
    }
  }

  Future<UserProfile> saveBasicProfile(UserProfile profile) async {
    if (!profile.isAdult) {
      throw Exception('You must be 18 or older to register.');
    }

    try {
      // Try update first if profile exists, else create
      final existing = await fetchProfile();
      final Map<String, dynamic> responseData;

      if (existing != null) {
        responseData = await _api.updateProfile(profile.toJson());
      } else {
        responseData = await _api.createProfile(profile.toJson());
      }

      return UserProfile.fromJson(responseData);
    } catch (e) {
      // If error occurs, rethrow clean message
      throw Exception('Couldn\'t save your profile. Please check your inputs and try again.');
    }
  }

  Future<Preferences?> fetchPreferences() async {
    try {
      final json = await _api.getPreferences();
      if (json.isEmpty) return null;
      return Preferences.fromJson(json);
    } catch (_) {
      return null;
    }
  }

  Future<Preferences> savePreferences(Preferences preferences) async {
    final validationError = preferences.validate();
    if (validationError != null) {
      throw Exception(validationError);
    }

    try {
      final json = await _api.updatePreferences(preferences.toJson());
      return Preferences.fromJson(json);
    } catch (_) {
      throw Exception('Couldn\'t save preferences. Try again.');
    }
  }

  Future<List<Interest>> fetchInterests() async {
    try {
      final raw = await _api.getInterests();
      final list = raw.map((item) {
        if (item is Map<String, dynamic>) {
          return Interest.fromJson(item);
        }
        return Interest(id: item.toString(), name: item.toString());
      }).toList();

      if (list.isNotEmpty) return list;
    } catch (_) {}

    // Fallback predefined Ethiopian interests
    return const [
      Interest(id: '1', name: '☕ Coffee Ceremony', category: 'Culture'),
      Interest(id: '2', name: '🏔️ Simien Mountains', category: 'Travel'),
      Interest(id: '3', name: '🎵 Ethio-Jazz & Music', category: 'Art'),
      Interest(id: '4', name: '💻 Tech & Startups', category: 'Professional'),
      Interest(id: '5', name: '📚 Ethiopian History', category: 'Education'),
      Interest(id: '6', name: '🍲 Traditional Cooking', category: 'Lifestyle'),
      Interest(id: '7', name: '🏃 Athletics & Running', category: 'Fitness'),
      Interest(id: '8', name: '🎨 Visual Art & Heritage', category: 'Culture'),
      Interest(id: '9', name: '✈️ World Travel', category: 'Lifestyle'),
      Interest(id: '10', name: '📖 Literature & Poetry', category: 'Education'),
      Interest(id: '11', name: '⚽ Football', category: 'Sports'),
      Interest(id: '12', name: '🌱 Social Impact', category: 'Community'),
    ];
  }

  Future<void> saveInterests(List<String> interestIds) async {
    if (interestIds.length < 3) {
      throw Exception('Please select at least 3 interests.');
    }
    try {
      await _api.setInterests(interestIds);
    } catch (_) {
      // In offline/mock fallback, don't crash
    }
  }

  Future<ProfilePhoto> uploadPhoto({
    required List<int> bytes,
    required String contentType,
    bool isPrimary = false,
  }) async {
    try {
      // 1. Request presigned upload URL from backend
      final uploadMeta = await _api.requestPhotoUploadUrl(contentType);
      final uploadUrl = uploadMeta['uploadUrl']?.toString();
      final storageKey = uploadMeta['storageKey']?.toString();

      if (uploadUrl != null && storageKey != null) {
        // 2. Upload directly to Object Storage
        await _api.uploadDirectToStorage(uploadUrl, bytes, contentType);

        // 3. Confirm completion with backend
        final completedData = await _api.completePhotoUpload(
          storageKey,
          isPrimary: isPrimary,
        );
        return ProfilePhoto.fromJson(completedData);
      }

      throw Exception('Upload URL generation failed.');
    } catch (e) {
      throw Exception('This photo couldn\'t be uploaded. Please try a different image.');
    }
  }

  Future<void> setPrimaryPhoto(String photoId) async {
    await _api.setPrimaryPhoto(photoId);
  }

  Future<void> deletePhoto(String photoId) async {
    await _api.deletePhoto(photoId);
  }

  Future<OnboardingProgress> checkOnboardingProgress() async {
    final profile = await fetchProfile();

    final hasProfile = profile != null && profile.firstName.isNotEmpty;
    final hasPreferences = (await fetchPreferences()) != null;
    final hasInterests = profile != null && profile.interests.length >= 3;
    final hasPrimaryPhoto = profile != null && profile.photos.isNotEmpty;

    String nextRoute = '/onboarding/profile';
    if (!hasProfile) {
      nextRoute = '/onboarding/profile';
    } else if (!hasPreferences) {
      nextRoute = '/onboarding/preferences';
    } else if (!hasInterests) {
      nextRoute = '/onboarding/interests';
    } else if (!hasPrimaryPhoto) {
      nextRoute = '/onboarding/photos';
    } else {
      nextRoute = '/onboarding/preview';
    }

    return OnboardingProgress(
      hasProfile: hasProfile,
      hasPreferences: hasPreferences,
      hasInterests: hasInterests,
      hasPrimaryPhoto: hasPrimaryPhoto,
      nextRoute: nextRoute,
    );
  }
}
