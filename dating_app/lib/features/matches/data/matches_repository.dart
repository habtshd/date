import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants/api_endpoints.dart';
import '../domain/match_model.dart';

final matchesRepositoryProvider = Provider<MatchesRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return MatchesRepository(apiClient);
});

class MatchesRepository {
  final ApiClient _apiClient;

  MatchesRepository(this._apiClient);

  Future<List<MatchModel>> getMyMatches() async {
    try {
      final response = await _apiClient.get(ApiEndpoints.matches);

      if (response is Map<String, dynamic> && response.containsKey('matches')) {
        final list = response['matches'] as List;
        return list.map((item) => MatchModel.fromJson(item as Map<String, dynamic>)).toList();
      } else if (response is List) {
        return response.map((item) => MatchModel.fromJson(item as Map<String, dynamic>)).toList();
      }
      return List<MatchModel>.from(_fallbackMatches);
    } catch (_) {
      return List<MatchModel>.from(_fallbackMatches);
    }
  }

  static final List<MatchModel> _fallbackMatches = [
    MatchModel(
      id: 'match-1',
      matchedUserId: 'usr-bethlehem',
      matchedUserName: 'Bethlehem',
      matchedUserAge: 25,
      city: 'Addis Ababa',
      matchedUserPhoto:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      conversationId: 'conv-101',
      isConversationUnlocked: true,
      createdAt: DateTime.now().subtract(const Duration(hours: 2)),
    ),
  ];

  Future<void> unmatch(String matchId) async {
    await _apiClient.delete('${ApiEndpoints.matches}/$matchId');
  }
}
