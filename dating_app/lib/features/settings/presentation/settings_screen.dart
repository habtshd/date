import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme.dart';
import '../../auth/data/auth_repository.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authUser = ref.watch(authStateProvider).user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          children: [
            const Text(
              'ACCOUNT & SECURITY',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: AppTheme.textMuted,
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 10),
            _buildSettingTile(
              icon: Icons.phone_outlined,
              title: 'Phone Number',
              subtitle: authUser?.phoneNumber ?? 'Not connected',
            ),
            _buildSettingTile(
              icon: Icons.verified_user_outlined,
              title: 'Identity Verification',
              subtitle: authUser?.verificationStatus ?? 'UNVERIFIED',
              onTap: () => context.push('/verification/status'),
            ),
            const SizedBox(height: 24),
            const Text(
              'PRIVACY & LEGAL',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: AppTheme.textMuted,
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 10),
            _buildSettingTile(
              icon: Icons.lock_outline_rounded,
              title: 'Privacy Policy',
              subtitle: 'Learn how your data is protected',
            ),
            _buildSettingTile(
              icon: Icons.description_outlined,
              title: 'Terms of Service',
              subtitle: 'Platform safety rules & guidelines',
            ),
            const SizedBox(height: 36),
            ElevatedButton.icon(
              onPressed: () async {
                final confirm = await showDialog<bool>(
                  context: context,
                  builder: (context) => AlertDialog(
                    backgroundColor: AppTheme.darkCard,
                    title: const Text('Log Out?'),
                    content: const Text(
                      'Are you sure you want to log out of your session?',
                      style: TextStyle(color: AppTheme.textSecondary),
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
                        child: const Text('Log Out'),
                      ),
                    ],
                  ),
                );

                if (confirm == true) {
                  await ref.read(authStateProvider.notifier).logout();
                  if (context.mounted) {
                    context.go('/auth/welcome');
                  }
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.accentCoral.withOpacity(0.12),
                foregroundColor: AppTheme.accentCoral,
                side: const BorderSide(color: AppTheme.accentCoral, width: 1),
                elevation: 0,
              ),
              icon: const Icon(Icons.logout_rounded),
              label: const Text('Log Out'),
            ),
            const SizedBox(height: 20),
            const Center(
              child: Text(
                'Dating v1.0.0 (Phase 4 MVP)',
                style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSettingTile({
    required IconData icon,
    required String title,
    required String subtitle,
    VoidCallback? onTap,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: AppTheme.darkCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.darkCardBorder),
      ),
      child: ListTile(
        onTap: onTap,
        leading: Icon(icon, color: AppTheme.primaryGold, size: 22),
        title: Text(
          title,
          style: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            color: AppTheme.textPrimary,
          ),
        ),
        subtitle: Text(
          subtitle,
          style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
        ),
        trailing: onTap != null
            ? const Icon(Icons.chevron_right_rounded, color: AppTheme.textMuted)
            : null,
      ),
    );
  }
}
