import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme.dart';
import '../../../core/widgets/app_button.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 16),
              Center(
                child: Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: const LinearGradient(
                      colors: [AppTheme.primaryGold, AppTheme.accentCrimson],
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.primaryGold.withOpacity(0.3),
                        blurRadius: 20,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.favorite_rounded,
                    color: Colors.white,
                    size: 40,
                  ),
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                'Meaningful Dating,\nBuilt on Trust.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.textPrimary,
                  height: 1.2,
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'Ethiopia’s first verified dating platform. Every profile is backed by national identity verification.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14,
                  color: AppTheme.textSecondary,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 28),
              _buildFeatureRow(
                icon: Icons.verified_user_rounded,
                title: 'Fayda ID Verified',
                subtitle: 'Zero catfish, verified humans only',
              ),
              const SizedBox(height: 14),
              _buildFeatureRow(
                icon: Icons.lock_rounded,
                title: 'Private & Protected',
                subtitle: 'Your personal data never leaves the vault',
              ),
              const SizedBox(height: 14),
              _buildFeatureRow(
                icon: Icons.chat_bubble_rounded,
                title: 'Intentional Matching',
                subtitle: 'High-signal conversations and serious relationships',
              ),
              const SizedBox(height: 32),
              AppButton(
                text: 'Get Started with Phone',
                onPressed: () => context.push('/auth/register'),
                icon: Icons.phone_android_rounded,
              ),
              const SizedBox(height: 14),
              const Text(
                'By signing up, you agree to our Terms of Service & Privacy Policy',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 11,
                  color: AppTheme.textMuted,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFeatureRow({
    required IconData icon,
    required String title,
    required String subtitle,
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
              color: AppTheme.primaryGold.withOpacity(0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: AppTheme.primaryGold, size: 22),
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
                  subtitle,
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
