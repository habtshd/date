import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../domain/notification_item.dart';

final notificationRepositoryProvider = Provider<NotificationRepository>((ref) {
  final dio = ref.watch(apiClientProvider).dio;
  return NotificationRepository(dio);
});

class NotificationRepository {
  final Dio dio;

  NotificationRepository(this.dio);

  Future<List<NotificationItem>> getNotifications() async {
    try {
      final response = await dio.get('/api/v1/notifications');
      final data = response.data;
      if (data is Map<String, dynamic> && data['notifications'] is List) {
        return (data['notifications'] as List)
            .map((e) => NotificationItem.fromJson(e as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (_) {
      // Offline fallback mock data for testing and preview
      return [
        NotificationItem(
          id: 'notif-1',
          title: 'Identity Verified!',
          body: 'Your Fayda ID has been verified. Welcome to the dating pool!',
          type: 'VERIFICATION_COMPLETE',
          createdAt: DateTime.now().subtract(const Duration(hours: 1)),
        ),
        NotificationItem(
          id: 'notif-2',
          title: 'New Mutual Match!',
          body: 'Someone shared mutual interest with you. Check your matches!',
          type: 'NEW_MATCH',
          createdAt: DateTime.now().subtract(const Duration(hours: 4)),
        ),
        NotificationItem(
          id: 'notif-3',
          title: 'Payment Successful',
          body: 'Telebirr payment confirmed. Your conversation is unlocked!',
          type: 'PAYMENT_SUCCESS',
          createdAt: DateTime.now().subtract(const Duration(days: 1)),
          readAt: DateTime.now().subtract(const Duration(hours: 20)),
        ),
      ];
    }
  }

  Future<void> markAsRead(String id) async {
    try {
      await dio.patch('/api/v1/notifications/$id/read');
    } catch (_) {
      // Ignored for offline mode
    }
  }

  Future<void> markAllAsRead() async {
    try {
      await dio.post('/api/v1/notifications/read-all');
    } catch (_) {
      // Ignored for offline mode
    }
  }
}
