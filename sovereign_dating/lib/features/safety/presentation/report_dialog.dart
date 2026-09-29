import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../app/theme.dart';
import '../../../core/widgets/app_text_field.dart';
import '../data/safety_repository.dart';

class SafetyDialogs {
  static Future<void> showReportDialog({
    required BuildContext context,
    required WidgetRef ref,
    required String reportedUserId,
    required String userName,
    String? conversationId,
  }) async {
    final reasons = [
      {'key': 'HARASSMENT', 'label': 'Harassment or Offensive Behavior'},
      {'key': 'INAPPROPRIATE_CONTENT', 'label': 'Inappropriate Photos or Content'},
      {'key': 'SPAM', 'label': 'Spam, Commercial, or Bot Activity'},
      {'key': 'FAKE_ACCOUNT', 'label': 'Impersonation or Fake Account'},
      {'key': 'UNDERAGE', 'label': 'Suspected Underage Account'},
      {'key': 'OTHER', 'label': 'Other Safety Concern'},
    ];

    String selectedReason = 'HARASSMENT';
    final descController = TextEditingController();
    bool isSubmitting = false;

    await showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              backgroundColor: AppTheme.darkCard,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(24),
                side: const BorderSide(color: AppTheme.darkCardBorder),
              ),
              title: Row(
                children: [
                  const Icon(Icons.shield_rounded, color: AppTheme.accentCoral),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Report $userName',
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                  ),
                ],
              ),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Select Reason',
                      style: TextStyle(
                        color: AppTheme.textSecondary,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      value: selectedReason,
                      dropdownColor: AppTheme.darkCard,
                      style: const TextStyle(color: AppTheme.textPrimary, fontSize: 14),
                      decoration: const InputDecoration(
                        contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      ),
                      items: reasons.map((r) {
                        return DropdownMenuItem(
                          value: r['key'],
                          child: Text(r['label']!),
                        );
                      }).toList(),
                      onChanged: (v) {
                        if (v != null) setState(() => selectedReason = v);
                      },
                    ),
                    const SizedBox(height: 16),
                    AppTextField(
                      controller: descController,
                      label: 'Additional Details (Optional)',
                      hint: 'Help our trust & safety team investigate...',
                      maxLines: 3,
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: isSubmitting ? null : () => Navigator.pop(context),
                  child: const Text('Cancel', style: TextStyle(color: AppTheme.textSecondary)),
                ),
                ElevatedButton(
                  onPressed: isSubmitting
                      ? null
                      : () async {
                          setState(() => isSubmitting = true);
                          try {
                            await ref.read(safetyRepositoryProvider).submitReport(
                                  reportedUserId: reportedUserId,
                                  reason: selectedReason,
                                  description: descController.text.trim().isNotEmpty
                                      ? descController.text.trim()
                                      : null,
                                  conversationId: conversationId,
                                );
                            if (context.mounted) {
                              Navigator.pop(context);
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Report submitted. Our team reviews all reports within 24 hours.'),
                                  backgroundColor: AppTheme.accentEmerald,
                                ),
                              );
                            }
                          } catch (e) {
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text('Failed to submit report: $e'),
                                  backgroundColor: AppTheme.accentCoral,
                                ),
                              );
                            }
                          } finally {
                            if (context.mounted) setState(() => isSubmitting = false);
                          }
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.accentCoral,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: isSubmitting
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Text('Submit Report'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  static Future<bool> showBlockConfirmationDialog({
    required BuildContext context,
    required WidgetRef ref,
    required String targetUserId,
    required String userName,
  }) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: AppTheme.darkCard,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
            side: const BorderSide(color: AppTheme.darkCardBorder),
          ),
          title: Text('Block $userName?'),
          content: Text(
            'They will no longer appear in your discovery feed, and all messaging will be permanently blocked.',
            style: const TextStyle(color: AppTheme.textSecondary, fontSize: 14),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel', style: TextStyle(color: AppTheme.textSecondary)),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(context, true),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.accentCoral,
                foregroundColor: Colors.white,
              ),
              child: const Text('Block'),
            ),
          ],
        );
      },
    );

    if (confirmed == true) {
      try {
        await ref.read(safetyRepositoryProvider).blockUser(targetUserId);
        return true;
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Failed to block user: $e'),
              backgroundColor: AppTheme.accentCoral,
            ),
          );
        }
        return false;
      }
    }
    return false;
  }
}
