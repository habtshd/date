import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../app/theme.dart';
import '../../../core/widgets/loading_indicator.dart';
import '../data/notification_repository.dart';
import '../domain/notification_item.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() =>
      _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  List<NotificationItem> _notifications = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    setState(() => _isLoading = true);
    try {
      final items =
          await ref.read(notificationRepositoryProvider).getNotifications();
      if (mounted) {
        setState(() {
          _notifications = items;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _markAllRead() async {
    await ref.read(notificationRepositoryProvider).markAllAsRead();
    if (mounted) {
      setState(() {
        _notifications = _notifications
            .map((n) => NotificationItem(
                  id: n.id,
                  title: n.title,
                  body: n.body,
                  type: n.type,
                  createdAt: n.createdAt,
                  readAt: DateTime.now(),
                ))
            .toList();
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('All notifications marked as read'),
          backgroundColor: AppTheme.accentEmerald,
        ),
      );
    }
  }

  Widget _getIconForType(String type) {
    switch (type) {
      case 'VERIFICATION_COMPLETE':
        return Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: AppTheme.accentEmerald.withOpacity(0.15),
            shape: BoxShape.circle,
            border: Border.all(color: AppTheme.accentEmerald.withOpacity(0.4)),
          ),
          child: const Icon(Icons.verified_user_rounded,
              color: AppTheme.accentEmerald, size: 22),
        );
      case 'NEW_MATCH':
        return Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: AppTheme.accentCoral.withOpacity(0.15),
            shape: BoxShape.circle,
            border: Border.all(color: AppTheme.accentCoral.withOpacity(0.4)),
          ),
          child: const Icon(Icons.favorite_rounded,
              color: AppTheme.accentCoral, size: 22),
        );
      case 'PAYMENT_SUCCESS':
        return Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: AppTheme.primaryGold.withOpacity(0.15),
            shape: BoxShape.circle,
            border: Border.all(color: AppTheme.primaryGold.withOpacity(0.4)),
          ),
          child: const Icon(Icons.payments_rounded,
              color: AppTheme.primaryGold, size: 22),
        );
      default:
        return Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: Colors.white10,
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.notifications_rounded,
              color: AppTheme.textPrimary, size: 22),
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    final unreadCount = _notifications.where((n) => !n.isRead).length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          if (unreadCount > 0)
            TextButton(
              onPressed: _markAllRead,
              child: const Text(
                'Mark all read',
                style: TextStyle(
                  color: AppTheme.primaryGold,
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: LoadingIndicator(message: 'Loading alerts...'))
          : _notifications.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.notifications_off_outlined,
                          size: 64, color: AppTheme.textMuted),
                      const SizedBox(height: 16),
                      const Text(
                        'No notifications yet',
                        style: TextStyle(
                          color: AppTheme.textPrimary,
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'When you get matches or messages, you will see them here.',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: AppTheme.textSecondary,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadNotifications,
                  color: AppTheme.primaryGold,
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 12),
                    itemCount: _notifications.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final item = _notifications[index];
                      final timeStr =
                          DateFormat('MMM d, h:mm a').format(item.createdAt);

                      return InkWell(
                        onTap: () {
                          if (!item.isRead) {
                            ref
                                .read(notificationRepositoryProvider)
                                .markAsRead(item.id);
                            setState(() {
                              _notifications[index] = NotificationItem(
                                id: item.id,
                                title: item.title,
                                body: item.body,
                                type: item.type,
                                createdAt: item.createdAt,
                                readAt: DateTime.now(),
                              );
                            });
                          }
                        },
                        borderRadius: BorderRadius.circular(16),
                        child: Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: item.isRead
                                ? AppTheme.darkCard
                                : AppTheme.darkCard.withOpacity(0.9),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: item.isRead
                                  ? AppTheme.darkCardBorder
                                  : AppTheme.primaryGold.withOpacity(0.4),
                              width: item.isRead ? 1 : 1.5,
                            ),
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _getIconForType(item.type),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Expanded(
                                          child: Text(
                                            item.title,
                                            style: TextStyle(
                                              color: AppTheme.textPrimary,
                                              fontSize: 14,
                                              fontWeight: item.isRead
                                                  ? FontWeight.w600
                                                  : FontWeight.w800,
                                            ),
                                          ),
                                        ),
                                        if (!item.isRead)
                                          Container(
                                            width: 8,
                                            height: 8,
                                            decoration: const BoxDecoration(
                                              color: AppTheme.primaryGold,
                                              shape: BoxShape.circle,
                                            ),
                                          ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      item.body,
                                      style: const TextStyle(
                                        color: AppTheme.textSecondary,
                                        fontSize: 12.5,
                                        height: 1.35,
                                      ),
                                    ),
                                    const SizedBox(height: 6),
                                    Text(
                                      timeStr,
                                      style: const TextStyle(
                                        color: AppTheme.textMuted,
                                        fontSize: 11,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
