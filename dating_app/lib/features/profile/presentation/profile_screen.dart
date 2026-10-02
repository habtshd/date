import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme.dart';
import '../../../core/widgets/loading_indicator.dart';
import '../data/profile_repository.dart';
import '../domain/profile_model.dart';
import '../../auth/data/auth_repository.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  UserProfileModel? _profile;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    setState(() => _isLoading = true);
    try {
      final p = await ref.read(profileRepositoryProvider).getMyProfile();
      if (mounted) {
        setState(() {
          _profile = p;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final authUser = ref.watch(authStateProvider).user;
    final isVerified = authUser?.isVerified ?? false;

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => context.push('/app/settings'),
          ),
        ],
      ),
      body: SafeArea(
        child: _isLoading
            ? const LoadingIndicator(message: 'Loading profile...')
            : SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
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
                              border: Border.all(
                                color: isVerified
                                    ? AppTheme.accentEmerald
                                    : AppTheme.primaryGold,
                                width: 2.5,
                              ),
                            ),
                            child: const Icon(
                              Icons.person_rounded,
                              size: 64,
                              color: AppTheme.primaryGold,
                            ),
                          ),
                          if (isVerified)
                            Positioned(
                              bottom: 0,
                              right: 0,
                              child: Container(
                                padding: const EdgeInsets.all(4),
                                decoration: const BoxDecoration(
                                  color: AppTheme.accentEmerald,
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(
                                  Icons.check_rounded,
                                  color: Colors.black,
                                  size: 18,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 18),
                    Text(
                      _profile?.firstName ?? 'My Profile',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      _profile != null ? '${_profile!.city} • ${_profile!.age} yrs' : '',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 14,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 24),
                    // Verification Status Card
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppTheme.darkCard,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isVerified
                              ? AppTheme.accentEmerald.withOpacity(0.5)
                              : AppTheme.primaryGold.withOpacity(0.5),
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            isVerified
                                ? Icons.verified_user_rounded
                                : Icons.gpp_maybe_rounded,
                            color: isVerified
                                ? AppTheme.accentEmerald
                                : AppTheme.primaryGold,
                            size: 32,
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  isVerified ? 'Fayda ID Verified' : 'Identity Unverified',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 15,
                                    color: AppTheme.textPrimary,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  isVerified
                                      ? 'Full access to discovery and messaging'
                                      : 'Verify identity to unlock full matching',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: AppTheme.textSecondary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          if (!isVerified)
                            TextButton(
                              onPressed: () => context.push('/verification/prompt'),
                              child: const Text('Verify', style: TextStyle(color: AppTheme.primaryGold)),
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                    if (_profile?.bio != null) ...[
                      const Text(
                        'Bio',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppTheme.inputBackground,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppTheme.darkCardBorder),
                        ),
                        child: Text(
                          _profile!.bio!,
                          style: const TextStyle(fontSize: 14, color: AppTheme.textPrimary, height: 1.4),
                        ),
                      ),
                      const SizedBox(height: 20),
                    ],
                    if (_profile != null && _profile!.interests.isNotEmpty) ...[
                      const Text(
                        'Interests',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: _profile!.interests.map((interest) {
                          return Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: AppTheme.darkCard,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppTheme.darkCardBorder),
                            ),
                            child: Text(
                              interest,
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: AppTheme.primaryGold,
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ],
                    const SizedBox(height: 32),
                    OutlinedButton.icon(
                      onPressed: () => context.push('/onboarding/preferences'),
                      icon: const Icon(Icons.tune_rounded),
                      label: const Text('Edit Dating Preferences'),
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
      ),
    );
  }
}
