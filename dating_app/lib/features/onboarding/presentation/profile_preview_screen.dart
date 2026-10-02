import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme.dart';
import '../../../core/widgets/app_button.dart';
import '../../verification/data/verification_repository.dart';
import '../../auth/data/auth_repository.dart';
import 'controllers/onboarding_controllers.dart';

class ProfilePreviewScreen extends ConsumerStatefulWidget {
  const ProfilePreviewScreen({super.key});

  @override
  ConsumerState<ProfilePreviewScreen> createState() =>
      _ProfilePreviewScreenState();
}

class _ProfilePreviewScreenState extends ConsumerState<ProfilePreviewScreen> {
  bool _isStartingVerification = false;

  Future<void> _handleStartVerification() async {
    setState(() => _isStartingVerification = true);
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
        context.go('/verification/status');
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
      if (mounted) setState(() => _isStartingVerification = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final profileState = ref.watch(profileControllerProvider);
    final prefsState = ref.watch(preferencesControllerProvider);
    final photosState = ref.watch(photosControllerProvider);
    final interestsState = ref.watch(interestsControllerProvider);

    final profile = profileState.profile;
    final photos = photosState.photos;
    final primaryPhoto = photos.isNotEmpty
        ? (photos.firstWhere((p) => p.isPrimary, orElse: () => photos.first))
        : null;

    final selectedInterests = interestsState.availableInterests
        .where((i) => interestsState.selectedInterestIds.contains(i.id))
        .toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile Preview'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            tooltip: 'Edit Profile',
            onPressed: () => context.push('/onboarding/profile'),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildStepHeader(
                step: 5,
                totalSteps: 5,
                title: 'Review Your Profile',
                subtitle: 'Confirm your details before beginning Fayda identity verification.',
              ),
              const SizedBox(height: 20),

              // Preview Card
              Container(
                decoration: BoxDecoration(
                  color: AppTheme.darkCard,
                  borderRadius: BorderRadius.circular(28),
                  border: Border.all(color: AppTheme.primaryGold.withValues(alpha: 0.5)),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.primaryGold.withValues(alpha: 0.15),
                      blurRadius: 20,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                clipBehavior: Clip.antiAlias,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Primary Image
                    Container(
                      height: 260,
                      width: double.infinity,
                      color: AppTheme.darkSurface,
                      child: primaryPhoto != null && primaryPhoto.url.startsWith('http')
                          ? Image.network(
                              primaryPhoto.url,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => _buildAvatarPlaceholder(),
                            )
                          : _buildAvatarPlaceholder(),
                    ),

                    Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  profile != null
                                      ? '${profile.firstName}, ${profile.age}'
                                      : 'Sara, 25',
                                  style: const TextStyle(
                                    fontSize: 22,
                                    fontWeight: FontWeight.w800,
                                    color: AppTheme.textPrimary,
                                  ),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: AppTheme.primaryGold.withValues(alpha: 0.2),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  prefsState.preferences.relationshipGoal?.displayName ??
                                      'Marriage',
                                  style: const TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: AppTheme.primaryGold,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              const Icon(Icons.location_on_rounded,
                                  size: 16, color: AppTheme.primaryGold),
                              const SizedBox(width: 4),
                              Text(
                                profile?.city ?? 'Addis Ababa',
                                style: const TextStyle(
                                  fontSize: 13,
                                  color: AppTheme.textSecondary,
                                ),
                              ),
                            ],
                          ),
                          if (profile?.bio != null && profile!.bio!.isNotEmpty) ...[
                            const SizedBox(height: 12),
                            Text(
                              profile.bio!,
                              style: const TextStyle(
                                fontSize: 13,
                                color: AppTheme.textPrimary,
                                height: 1.4,
                              ),
                            ),
                          ],
                          if (selectedInterests.isNotEmpty) ...[
                            const SizedBox(height: 14),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: selectedInterests.map((interest) {
                                return Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: AppTheme.inputBackground,
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(color: AppTheme.darkCardBorder),
                                  ),
                                  child: Text(
                                    interest.name,
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: AppTheme.primaryGold,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                );
                              }).toList(),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Verification Callout Card
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: AppTheme.accentEmerald.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppTheme.accentEmerald.withValues(alpha: 0.3)),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppTheme.accentEmerald.withValues(alpha: 0.15),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.verified_user_rounded,
                        color: AppTheme.accentEmerald,
                        size: 26,
                      ),
                    ),
                    const SizedBox(width: 14),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "You're Almost Ready!",
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w800,
                              color: AppTheme.textPrimary,
                            ),
                          ),
                          SizedBox(height: 2),
                          Text(
                            'Verify your identity with Fayda to enter the active dating discovery pool.',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppTheme.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 28),

              AppButton(
                text: 'Verify Identity with Fayda',
                isLoading: _isStartingVerification,
                onPressed: _handleStartVerification,
                icon: Icons.shield_rounded,
              ),
              const SizedBox(height: 12),
              OutlinedButton(
                onPressed: () => context.go('/app/discover'),
                child: const Text('Browse in Preview Mode'),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAvatarPlaceholder() {
    return const Center(
      child: Icon(
        Icons.person_rounded,
        size: 72,
        color: AppTheme.primaryGold,
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
