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
    return [];
  }

  Future<List<DiscoveryProfile>> getPreviewProfiles() async {
    final response = await _apiClient.get(ApiEndpoints.previewDiscovery);

    if (response is Map<String, dynamic> && response.containsKey('profiles')) {
      final list = response['profiles'] as List;
      return list.map((item) => DiscoveryProfile.fromJson(item as Map<String, dynamic>)).toList();
    } else if (response is List) {
      return response.map((item) => DiscoveryProfile.fromJson(item as Map<String, dynamic>)).toList();
    }
    return [];
  }

  Future<LikeResult> likeUser(String targetUserId) async {
    final response = await _apiClient.post('${ApiEndpoints.likes}/$targetUserId');
    return LikeResult.fromJson(response as Map<String, dynamic>);
  }

  Future<void> passUser(String targetUserId) async {
    await _apiClient.post('${ApiEndpoints.passes}/$targetUserId');
  }
}
