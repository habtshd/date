import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme.dart';
import '../../../core/widgets/app_button.dart';
import '../domain/conversation_model.dart';
import '../../payments/data/payment_repository.dart';

class LockedConversationScreen extends ConsumerStatefulWidget {
  final ConversationModel conversation;
  final VoidCallback? onUnlocked;

  const LockedConversationScreen({
    super.key,
    required this.conversation,
    this.onUnlocked,
  });

  @override
  ConsumerState<LockedConversationScreen> createState() =>
      _LockedConversationScreenState();
}

class _LockedConversationScreenState
    extends ConsumerState<LockedConversationScreen> {
  bool _isLoading = false;

  Future<void> _handleStartChat() async {
    setState(() => _isLoading = true);

    try {
      final paymentRepo = ref.read(paymentRepositoryProvider);
      final paymentResult = await paymentRepo.initiatePayment(
        conversationId: widget.conversation.id,
      );

      if (mounted) {
        // Navigate to payment checkout/confirmation screen
        context.push(
          '/payments/checkout',
          extra: {
            'conversationId': widget.conversation.id,
            'paymentResult': paymentResult,
            'userName': widget.conversation.otherUserName,
          },
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to initiate payment: $e'),
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
    final fee = widget.conversation.chatFeeEtb;

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.conversation.otherUserName),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(),
              Center(
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    Container(
                      width: 110,
                      height: 110,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppTheme.darkCard,
                        border: Border.all(color: AppTheme.darkCardBorder, width: 2),
                      ),
                      child: const Icon(
                        Icons.person_rounded,
                        size: 64,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryGold,
                          shape: BoxShape.circle,
                          border: Border.all(color: AppTheme.darkBackground, width: 3),
                        ),
                        child: const Icon(
                          Icons.lock_rounded,
                          size: 20,
                          color: Colors.black,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 28),
              Text(
                'You and ${widget.conversation.otherUserName} Matched!',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 10),
              const Text(
                'Start a private, encrypted conversation. A single unlock fee grants unlimited lifetime messaging with this person.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14,
                  color: AppTheme.textSecondary,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 32),
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppTheme.darkCard,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppTheme.darkCardBorder),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Conversation Fee',
                          style: TextStyle(
                            fontSize: 14,
                            color: AppTheme.textSecondary,
                          ),
                        ),
                        Text(
                          'ETB ${fee.toStringAsFixed(0)}',
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.primaryGold,
                          ),
                        ),
                      ],
                    ),
                    const Divider(height: 24, color: AppTheme.darkCardBorder),
                    _buildFeatureItem(Icons.check_circle_outline, 'One-time unlock per match'),
                    const SizedBox(height: 8),
                    _buildFeatureItem(Icons.check_circle_outline, 'Unlimited private messages'),
                    const SizedBox(height: 8),
                    _buildFeatureItem(Icons.check_circle_outline, 'Protected against unsolicited spam'),
                  ],
                ),
              ),
              const Spacer(),
              AppButton(
                text: 'Unlock Conversation (ETB ${fee.toStringAsFixed(0)})',
                isLoading: _isLoading,
                onPressed: _handleStartChat,
                icon: Icons.lock_open_rounded,
              ),
              const SizedBox(height: 12),
              Center(
                child: Text(
                  'Supported via Telebirr, CBE Birr, and Chapa',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppTheme.textMuted,
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

  Widget _buildFeatureItem(IconData icon, String label) {
    return Row(
      children: [
        Icon(icon, size: 16, color: AppTheme.accentEmerald),
        const SizedBox(width: 8),
        Text(
          label,
          style: const TextStyle(fontSize: 13, color: AppTheme.textPrimary),
        ),
      ],
    );
  }
}
