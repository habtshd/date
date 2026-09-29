import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme.dart';
import '../../../core/widgets/app_button.dart';
import '../data/verification_repository.dart';
import '../../auth/data/auth_repository.dart';

class VerificationPromptScreen extends ConsumerStatefulWidget {
  const VerificationPromptScreen({super.key});

  @override
  ConsumerState<VerificationPromptScreen> createState() =>
      _VerificationPromptScreenState();
}

class _VerificationPromptScreenState
    extends ConsumerState<VerificationPromptScreen> {
  bool _isLoading = false;

  Future<void> _handleStartVerification() async {
    setState(() => _isLoading = true);

    try {
      await ref
          .read(verificationRepositoryProvider)
          .startVerification(provider: 'FAYDA');

      // Update auth user state to PENDING
      final currentAuth = ref.read(authStateProvider);
      if (currentAuth.user != null) {
        ref.read(authStateProvider.notifier).updateUser(
              currentAuth.user!.copyWith(verificationStatus: 'PENDING'),
            );
      }

      if (mounted) {
        context.push('/verification/status');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to initiate verification: $e'),
            backgroundColor: AppTheme.accentCoral,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Identity Verification'),
        actions: [
          TextButton(
            onPressed: () => context.go('/app/discover'),
            child: const Text(
              'Skip for now',
              style: TextStyle(color: AppTheme.textSecondary, fontSize: 13),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(),
              Center(
                child: Container(
                  width: 90,
                  height: 90,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: const LinearGradient(
                      colors: [AppTheme.primaryGold, AppTheme.accentEmerald],
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.accentEmerald.withOpacity(0.3),
                        blurRadius: 24,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.verified_user_rounded,
                    color: Colors.white,
                    size: 48,
                  ),
                ),
              ),
              const SizedBox(height: 32),
              const Text(
                'Verify with Fayda National ID',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'To protect our community from impersonation, fraud, and bad actors, only Fayda-verified members can discover, like, and match.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14,
                  color: AppTheme.textSecondary,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 36),
              _buildCheckItem(
                icon: Icons.badge_outlined,
                title: 'Fayda National ID Scan',
                desc: 'Instant biometric match against Ethiopian registry',
              ),
              const SizedBox(height: 14),
              _buildCheckItem(
                icon: Icons.face_rounded,
                title: 'Quick Liveness Selfie',
                desc: 'Confirms that you are the real person in the ID photos',
              ),
              const SizedBox(height: 14),
              _buildCheckItem(
                icon: Icons.shield_outlined,
                title: 'Strict Privacy Guarantee',
                desc: 'ID number and biometric data are never saved or shared',
              ),
              const Spacer(),
              AppButton(
                text: 'Start Fayda Verification',
                isLoading: _isLoading,
                onPressed: _handleStartVerification,
                icon: Icons.security_rounded,
              ),
              const SizedBox(height: 14),
              Center(
                child: TextButton(
                  onPressed: () => context.go('/app/discover'),
                  child: const Text(
                    'Preview Discovery Feed First (Unverified)',
                    style: TextStyle(
                      color: AppTheme.primaryGold,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCheckItem({
    required IconData icon,
    required String title,
    required String desc,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.darkCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.darkCardBorder),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppTheme.accentEmerald.withOpacity(0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: AppTheme.accentEmerald, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  desc,
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppTheme.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
