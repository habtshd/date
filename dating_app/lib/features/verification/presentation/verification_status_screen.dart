import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme.dart';
import '../../../core/widgets/app_button.dart';
import '../data/verification_repository.dart';
import '../../auth/data/auth_repository.dart';

class VerificationStatusScreen extends ConsumerStatefulWidget {
  const VerificationStatusScreen({super.key});

  @override
  ConsumerState<VerificationStatusScreen> createState() =>
      _VerificationStatusScreenState();
}

class _VerificationStatusScreenState
    extends ConsumerState<VerificationStatusScreen> {
  String _status = 'PENDING';
  bool _isChecking = false;
  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    _checkStatus();
    // Poll every 5 seconds while pending
    _pollTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (_status == 'PENDING') {
        _checkStatus();
      }
    });
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  Future<void> _checkStatus() async {
    if (_isChecking) return;
    setState(() => _isChecking = true);

    try {
      final result = await ref.read(verificationRepositoryProvider).checkStatus();
      if (mounted) {
        setState(() => _status = result.status);

        if (result.isVerified) {
          final currentAuth = ref.read(authStateProvider);
          if (currentAuth.user != null) {
            ref.read(authStateProvider.notifier).updateUser(
                  currentAuth.user!.copyWith(verificationStatus: 'VERIFIED'),
                );
          }
        }
      }
    } catch (_) {
      // In offline/mock mode for testing, keep status
    } finally {
      if (mounted) setState(() => _isChecking = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isVerified = _status == 'VERIFIED';
    final isFailed = _status == 'FAILED';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Verification Status'),
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
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: isVerified
                        ? AppTheme.accentEmerald.withOpacity(0.15)
                        : isFailed
                            ? AppTheme.accentCoral.withOpacity(0.15)
                            : AppTheme.primaryGold.withOpacity(0.15),
                    border: Border.all(
                      color: isVerified
                          ? AppTheme.accentEmerald
                          : isFailed
                              ? AppTheme.accentCoral
                              : AppTheme.primaryGold,
                      width: 2.5,
                    ),
                  ),
                  child: Icon(
                    isVerified
                        ? Icons.verified_rounded
                        : isFailed
                            ? Icons.error_outline_rounded
                            : Icons.hourglass_top_rounded,
                    color: isVerified
                        ? AppTheme.accentEmerald
                        : isFailed
                            ? AppTheme.accentCoral
                            : AppTheme.primaryGold,
                    size: 48,
                  ),
                ),
              ),
              const SizedBox(height: 28),
              Text(
                isVerified
                    ? 'Identity Verified!'
                    : isFailed
                        ? 'Verification Could Not Complete'
                        : 'Verification in Progress',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                isVerified
                    ? 'Welcome to the verified dating pool. You can now discover, send likes, and connect with genuine verified members across Ethiopia.'
                    : isFailed
                        ? 'We could not match your selfie or document with the Fayda registry. Please ensure good lighting and clear camera focus, then try again.'
                        : 'Your Fayda national ID record and selfie are being validated with the verification authority. This usually takes under 30 seconds.',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 14,
                  color: AppTheme.textSecondary,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 36),
              if (!isVerified && !isFailed) ...[
                const Center(
                  child: SizedBox(
                    width: 28,
                    height: 28,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.5,
                      valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primaryGold),
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                const Center(
                  child: Text(
                    'Checking status automatically...',
                    style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
                  ),
                ),
              ],
              const Spacer(),
              if (isVerified) ...[
                AppButton(
                  text: 'Enter Dating Discovery',
                  onPressed: () => context.go('/app/discover'),
                  icon: Icons.explore_rounded,
                ),
              ] else if (isFailed) ...[
                AppButton(
                  text: 'Retry Verification',
                  onPressed: () => context.go('/verification/prompt'),
                  icon: Icons.refresh_rounded,
                ),
              ] else ...[
                AppButton(
                  text: 'Check Status Now',
                  isLoading: _isChecking,
                  onPressed: _checkStatus,
                  isOutlined: true,
                ),
                const SizedBox(height: 12),
                Center(
                  child: TextButton(
                    onPressed: () => context.go('/app/discover'),
                    child: const Text(
                      'Preview Discovery While Waiting',
                      style: TextStyle(color: AppTheme.textSecondary, fontSize: 13),
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}
