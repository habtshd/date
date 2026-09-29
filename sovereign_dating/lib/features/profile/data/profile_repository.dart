import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants/api_endpoints.dart';
import '../domain/profile_model.dart';

final profileRepositoryProvider = Provider<ProfileRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return ProfileRepository(apiClient);
});

class ProfileRepository {
  final ApiClient _apiClient;

  ProfileRepository(this._apiClient);

  Future<UserProfileModel?> getMyProfile() async {
    try {
      final response = await _apiClient.get(ApiEndpoints.profile);
      if (response is Map<String, dynamic>) {
        return UserProfileModel.fromJson(response);
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  Future<UserProfileModel> saveProfile(UserProfileModel profile) async {
    final response = await _apiClient.post(
      ApiEndpoints.profile,
      data: profile.toJson(),
    );
    return UserProfileModel.fromJson(response as Map<String, dynamic>);
  }

  Future<void> updatePreferences({
    required int minAge,
    required int maxAge,
    required String interestedInGender,
    String? city,
  }) async {
    await _apiClient.put(
      ApiEndpoints.preferences,
      data: {
        'minAge': minAge,
        'maxAge': maxAge,
        'interestedInGender': interestedInGender,
        if (city != null) 'city': city,
      },
    );
  }

  Future<ProfilePhotoModel> addPhoto({
    required String photoUrl,
    bool isPrimary = false,
  }) async {
    final response = await _apiClient.post(
      ApiEndpoints.photos,
      data: {
        'url': photoUrl,
        'isPrimary': isPrimary,
      },
    );
    return ProfilePhotoModel.fromJson(response as Map<String, dynamic>);
  }

  Future<void> setPrimaryPhoto(String photoId) async {
    await _apiClient.put('${ApiEndpoints.photos}/$photoId/primary');
  }

  Future<void> deletePhoto(String photoId) async {
    await _apiClient.delete('${ApiEndpoints.photos}/$photoId');
  }
}
