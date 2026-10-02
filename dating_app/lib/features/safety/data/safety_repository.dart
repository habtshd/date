import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants/api_endpoints.dart';

final safetyRepositoryProvider = Provider<SafetyRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return SafetyRepository(apiClient);
});

class SafetyRepository {
  final ApiClient _apiClient;

  SafetyRepository(this._apiClient);

  Future<void> blockUser(String userId) async {
    await _apiClient.post(ApiEndpoints.blockUser(userId));
  }

  Future<void> unblockUser(String userId) async {
    await _apiClient.delete(ApiEndpoints.blockUser(userId));
  }

  Future<void> submitReport({
    required String reportedUserId,
    required String reason, // HARASSMENT, INAPPROPRIATE_CONTENT, SPAM, FAKE_ACCOUNT, UNDERAGE, OTHER
    String? description,
    String? conversationId,
  }) async {
    await _apiClient.post(
      ApiEndpoints.reports,
      data: {
        'reportedUserId': reportedUserId,
        'reason': reason,
        if (description != null) 'description': description,
        if (conversationId != null) 'conversationId': conversationId,
      },
    );
  }
}
