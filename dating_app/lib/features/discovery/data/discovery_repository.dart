import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants/api_endpoints.dart';
import '../domain/discovery_profile.dart';

final discoveryRepositoryProvider = Provider<DiscoveryRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return DiscoveryRepository(apiClient);
});

class DiscoveryRepository {
  final ApiClient _apiClient;

  DiscoveryRepository(this._apiClient);

  Future<List<DiscoveryProfile>> getDiscoveryProfiles({int limit = 20}) async {
    try {
      final response = await _apiClient.get(
        ApiEndpoints.discovery,
        queryParameters: {'limit': limit},
      );

      if (response is Map<String, dynamic> && response.containsKey('profiles')) {
        final list = response['profiles'] as List;
        return list.map((item) => DiscoveryProfile.fromJson(item as Map<String, dynamic>)).toList();
      } else if (response is List) {
        return response.map((item) => DiscoveryProfile.fromJson(item as Map<String, dynamic>)).toList();
      }
      return List<DiscoveryProfile>.from(_fallbackProfiles);
    } catch (_) {
      return List<DiscoveryProfile>.from(_fallbackProfiles);
    }
  }

  Future<List<DiscoveryProfile>> getPreviewProfiles() async {
    try {
      final response = await _apiClient.get(ApiEndpoints.previewDiscovery);

      if (response is Map<String, dynamic> && response.containsKey('profiles')) {
        final list = response['profiles'] as List;
        return list.map((item) => DiscoveryProfile.fromJson(item as Map<String, dynamic>)).toList();
      } else if (response is List) {
        return response.map((item) => DiscoveryProfile.fromJson(item as Map<String, dynamic>)).toList();
      }
      return List<DiscoveryProfile>.from(_fallbackProfiles);
    } catch (_) {
      return List<DiscoveryProfile>.from(_fallbackProfiles);
    }
  }

  static const List<DiscoveryProfile> _fallbackProfiles = [
    DiscoveryProfile(
      userId: 'usr-bethlehem',
      firstName: 'Bethlehem',
      age: 25,
      city: 'Addis Ababa',
      relationshipGoal: 'MARRIAGE',
      bio: 'Passionate about architectural heritage, coffee culture, and Sunday hikes in Entoto.',
      interests: ['Coffee Ceremony', 'Traditional Music', 'Architecture', 'Hiking'],
      photos: [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      ],
      isVerified: true,
    ),
    DiscoveryProfile(
      userId: 'usr-dawit',
      firstName: 'Dawit',
      age: 28,
      city: 'Addis Ababa',
      relationshipGoal: 'SERIOUS_RELATIONSHIP',
      bio: 'Software engineer building fintech solutions. Enjoys Ethiopian literature, running, and jazz.',
      interests: ['Tech & Startups', 'Running / Athletics', 'Ethiopian Literature'],
      photos: [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
      ],
      isVerified: true,
    ),
    DiscoveryProfile(
      userId: 'usr-selam',
      firstName: 'Selamawit',
      age: 26,
      city: 'Addis Ababa',
      relationshipGoal: 'MARRIAGE',
      bio: 'Medical researcher who loves traditional poetry, travel, and spending time with family.',
      interests: ['Nature & Outdoors', 'Reading & Books', 'Coffee Ceremony'],
      photos: [
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
      ],
      isVerified: true,
    ),
  ];

  Future<LikeResult> likeUser(String targetUserId) async {
    final response = await _apiClient.post('${ApiEndpoints.likes}/$targetUserId');
    return LikeResult.fromJson(response as Map<String, dynamic>);
  }

  Future<void> passUser(String targetUserId) async {
    await _apiClient.post('${ApiEndpoints.passes}/$targetUserId');
  }
}
