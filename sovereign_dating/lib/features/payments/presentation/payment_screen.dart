import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme.dart';
import '../../../core/widgets/app_button.dart';
import '../data/payment_repository.dart';
import '../../chat/data/chat_repository.dart';

class PaymentScreen extends ConsumerStatefulWidget {
  final String conversationId;
  final PaymentInitResult paymentResult;
  final String userName;

  const PaymentScreen({
    super.key,
    required this.conversationId,
    required this.paymentResult,
    required this.userName,
  });

  @override
  ConsumerState<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends ConsumerState<PaymentScreen> {
  bool _isChecking = false;
  String _status = 'PENDING';
  Timer? _checkTimer;

  @override
  void initState() {
    super.initState();
    // Periodically verify with server whether webhook confirmed the transaction
    _checkTimer = Timer.periodic(const Duration(seconds: 4), (_) {
      if (_status != 'SUCCESS') {
        _verifyWithServer();
      }
    });
  }

  @override
  void dispose() {
    _checkTimer?.cancel();
    super.dispose();
  }

  Future<void> _verifyWithServer() async {
    if (_isChecking) return;
    setState(() => _isChecking = true);

    try {
      // 1. Check conversation status on backend (server is authority)
      final chatRepo = ref.read(chatRepositoryProvider);
      final conversation = await chatRepo.getConversation(widget.conversationId);

      if (mounted) {
        if (conversation.isUnlocked) {
          setState(() => _status = 'SUCCESS');
          _checkTimer?.cancel();
        } else {
          // Check payment record status
          final paymentRepo = ref.read(paymentRepositoryProvider);
          final pStatus = await paymentRepo.getPaymentStatus(widget.paymentResult.paymentId);
          setState(() => _status = pStatus);
        }
      }
    } catch (_) {
      // Ignore network errors during polling
    } finally {
      if (mounted) setState(() => _isChecking = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isSuccess = _status == 'SUCCESS';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Conversation Payment'),
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
                    color: isSuccess
                        ? AppTheme.accentEmerald.withOpacity(0.15)
                        : AppTheme.primaryGold.withOpacity(0.15),
                    border: Border.all(
                      color: isSuccess ? AppTheme.accentEmerald : AppTheme.primaryGold,
                      width: 2.5,
                    ),
                  ),
                  child: Icon(
                    isSuccess ? Icons.check_circle_rounded : Icons.payment_rounded,
                    color: isSuccess ? AppTheme.accentEmerald : AppTheme.primaryGold,
                    size: 44,
                  ),
                ),
              ),
              const SizedBox(height: 28),
              Text(
                isSuccess
                    ? 'Payment Confirmed!'
                    : 'Complete Your Payment',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                isSuccess
                    ? 'Your private chat with ${widget.userName} is now permanently unlocked.'
                    : 'Amount: ${widget.paymentResult.currency} ${widget.paymentResult.amount.toStringAsFixed(0)}. Please complete payment through Telebirr, CBE Birr, or card.',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 14,
                  color: AppTheme.textSecondary,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 32),
              if (!isSuccess) ...[
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: AppTheme.darkCard,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppTheme.darkCardBorder),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.shield_rounded, color: AppTheme.primaryGold, size: 24),
                      const SizedBox(width: 14),
                      const Expanded(
                        child: Text(
                          'Payment processed through verified National Gateway (Chapa). Never share OTP or PIN.',
                          style: TextStyle(
                            fontSize: 12,
                            color: AppTheme.textSecondary,
                            height: 1.3,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                const Center(
                  child: SizedBox(
                    width: 26,
                    height: 26,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.5,
                      valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primaryGold),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                const Center(
                  child: Text(
                    'Awaiting server confirmation callback...',
                    style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
                  ),
                ),
              ],
              const Spacer(),
              if (isSuccess) ...[
                AppButton(
                  text: 'Open Conversation',
                  onPressed: () {
                    context.go('/app/chats/${widget.conversationId}');
                  },
                  icon: Icons.chat_rounded,
                ),
              ] else ...[
                AppButton(
                  text: 'Verify Status Now',
                  isLoading: _isChecking,
                  onPressed: _verifyWithServer,
                  isOutlined: true,
                ),
                const SizedBox(height: 10),
                TextButton(
                  onPressed: () => context.pop(),
                  child: const Text(
                    'Cancel & Return to Matches',
                    style: TextStyle(color: AppTheme.textSecondary),
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
