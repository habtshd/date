import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme.dart';
import '../../../core/widgets/app_button.dart';
import 'controllers/onboarding_controllers.dart';

class InterestsScreen extends ConsumerWidget {
  const InterestsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(interestsControllerProvider);
    final controller = ref.read(interestsControllerProvider.notifier);

    final selectedCount = state.selectedInterestIds.length;
    final canContinue = selectedCount >= 3;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Interests'),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildStepHeader(
                step: 3,
                totalSteps: 5,
                title: 'What Interests You?',
                subtitle: 'Select at least 3 passions. This helps find common ground.',
              ),
              const SizedBox(height: 16),

              // Selected Counter Badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: canContinue
                      ? AppTheme.accentEmerald.withValues(alpha: 0.12)
                      : AppTheme.primaryGold.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: canContinue
                        ? AppTheme.accentEmerald.withValues(alpha: 0.4)
                        : AppTheme.primaryGold.withValues(alpha: 0.4),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      canContinue
                          ? Icons.check_circle_rounded
                          : Icons.info_outline_rounded,
                      size: 18,
                      color: canContinue
                          ? AppTheme.accentEmerald
                          : AppTheme.primaryGold,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '$selectedCount selected ${canContinue ? '✓' : '(select at least 3)'}',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: canContinue
                            ? AppTheme.accentEmerald
                            : AppTheme.primaryGold,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Interests Grid / Chips
              Expanded(
                child: state.isLoading
                    ? const Center(
                        child: CircularProgressIndicator(
                          valueColor:
                              AlwaysStoppedAnimation<Color>(AppTheme.primaryGold),
                        ),
                      )
                    : SingleChildScrollView(
                        child: Wrap(
                          spacing: 10,
                          runSpacing: 12,
                          children: state.availableInterests.map((interest) {
                            final isSelected =
                                state.selectedInterestIds.contains(interest.id);
                            return FilterChip(
                              label: Text(interest.name),
                              selected: isSelected,
                              onSelected: (_) =>
                                  controller.toggleInterest(interest.id),
                              selectedColor:
                                  AppTheme.primaryGold.withValues(alpha: 0.2),
                              checkmarkColor: AppTheme.primaryGold,
                              backgroundColor: AppTheme.darkCard,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                                side: BorderSide(
                                  color: isSelected
                                      ? AppTheme.primaryGold
                                      : AppTheme.darkCardBorder,
                                  width: isSelected ? 1.8 : 1.0,
                                ),
                              ),
                              labelStyle: TextStyle(
                                fontSize: 14,
                                fontWeight: isSelected
                                    ? FontWeight.w700
                                    : FontWeight.w500,
                                color: isSelected
                                    ? AppTheme.primaryGold
                                    : AppTheme.textPrimary,
                              ),
                            );
                          }).toList(),
                        ),
                      ),
              ),

              if (state.error != null) ...[
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Text(
                    state.error!,
                    style: const TextStyle(
                        color: AppTheme.accentCoral, fontSize: 13),
                    textAlign: TextAlign.center,
                  ),
                ),
              ],

              AppButton(
                text: 'Continue',
                isLoading: state.isLoading,
                onPressed: () async {
                  final success = await controller.saveInterests();
                  if (context.mounted && success) {
                    context.push('/onboarding/photos');
                  }
                },
                icon: Icons.arrow_forward_rounded,
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStepHeader({
    required int step,
    required int totalSteps,
    required String title,
    required String subtitle,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'STEP $step OF $totalSteps',
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w800,
                color: AppTheme.primaryGold,
                letterSpacing: 1.2,
              ),
            ),
            Text(
              '${((step / totalSteps) * 100).toInt()}% Complete',
              style: const TextStyle(
                fontSize: 12,
                color: AppTheme.textMuted,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: step / totalSteps,
            minHeight: 6,
            backgroundColor: AppTheme.darkCardBorder,
            valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primaryGold),
          ),
        ),
        const SizedBox(height: 16),
        Text(
          title,
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.w800,
            color: AppTheme.textPrimary,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          subtitle,
          style: const TextStyle(
            fontSize: 13,
            color: AppTheme.textSecondary,
          ),
        ),
      ],
    );
  }
}
