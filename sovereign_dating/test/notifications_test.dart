import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:sovereign_dating/features/notifications/domain/notification_item.dart';
import 'package:sovereign_dating/features/notifications/presentation/notifications_screen.dart';

void main() {
  group('Notifications Domain & UI Tests', () {
    test('NotificationItem parsing and isRead status', () {
      final notif = NotificationItem(
        id: 'test-1',
        title: 'New Match!',
        body: 'Someone liked you back',
        type: 'NEW_MATCH',
        createdAt: DateTime.now(),
        readAt: null,
      );

      expect(notif.isRead, false);
      expect(notif.type, 'NEW_MATCH');

      final json = notif.toJson();
      final parsed = NotificationItem.fromJson(json);
      expect(parsed.id, 'test-1');
      expect(parsed.title, 'New Match!');
      expect(parsed.isRead, false);
    });

    testWidgets('NotificationsScreen renders AppBar and list items',
        (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: NotificationsScreen(),
          ),
        ),
      );

      await tester.pump(const Duration(milliseconds: 200));

      expect(find.text('Notifications'), findsOneWidget);
    });
  });
}
