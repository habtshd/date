import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme.dart';
import '../../../core/widgets/loading_indicator.dart';
import '../../../core/widgets/error_view.dart';
import '../data/discovery_repository.dart';
import '../domain/discovery_profile.dart';
import 'widgets/discovery_card.dart';
import '../../auth/data/auth_repository.dart';

class DiscoveryScreen extends ConsumerStatefulWidget {
  const DiscoveryScreen({super.key});

  @override
  ConsumerState<DiscoveryScreen> createState() => _DiscoveryScreenState();
}

class _DiscoveryScreenState extends ConsumerState<DiscoveryScreen> {
  List<DiscoveryProfile> _profiles = [];
  int _currentIndex = 0;
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _fetchFeed();
  }

  Future<void> _fetchFeed() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final authState = ref.read(authStateProvider);
    final isVerified = authState.user?.isVerified ?? false;

    try {
      final repo = ref.read(discoveryRepositoryProvider);
      List<DiscoveryProfile> items;

      if (isVerified) {
        items = await repo.getDiscoveryProfiles();
      } else {
        items = await repo.getPreviewProfiles();
      }

      if (mounted) {
        setState(() {
          _profiles = items;
          _currentIndex = 0;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _handleLike() async {
    if (_currentIndex >= _profiles.length) return;

    final targetProfile = _profiles[_currentIndex];
    final repo = ref.read(discoveryRepositoryProvider);

    try {
      final result = await repo.likeUser(targetProfile.userId);

      if (mounted) {
        if (result.matched) {
          _showMatchDialog(targetProfile, result.conversationId);
        }

        setState(() {
          _currentIndex++;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to like profile: $e'),
            backgroundColor: AppTheme.accentCoral,
          ),
        );
      }
    }
  }

  Future<void> _handlePass() async {
    if (_currentIndex >= _profiles.length) return;

    final targetProfile = _profiles[_currentIndex];
    final repo = ref.read(discoveryRepositoryProvider);

    try {
      await repo.passUser(targetProfile.userId);
    } catch (_) {}

    if (mounted) {
      setState(() {
        _currentIndex++;
      });
    }
  }

  void _showMatchDialog(DiscoveryProfile profile, String? conversationId) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return Dialog(
          backgroundColor: Colors.transparent,
          insetPadding: const EdgeInsets.symmetric(horizontal: 24),
          child: Container(
            padding: const EdgeInsets.all(28),
            decoration: BoxDecoration(
              color: AppTheme.darkCard,
              borderRadius: BorderRadius.circular(28),
              border: Border.all(color: AppTheme.primaryGold, width: 2),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.primaryGold.withOpacity(0.3),
                  blurRadius: 30,
                  spreadRadius: 2,
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: const BoxDecoration(
                    color: AppTheme.accentCrimson,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.favorite_rounded,
                    color: Colors.white,
                    size: 44,
                  ),
                ),
                const SizedBox(height: 20),
                const Text(
                  "It's a Match!",
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w900,
                    color: AppTheme.textPrimary,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  "You and ${profile.firstName} liked each other!",
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppTheme.textSecondary,
                  ),
                ),
                const SizedBox(height: 28),
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context);
                      if (conversationId != null) {
                        context.push('/app/chats/$conversationId');
                      } else {
                        context.push('/app/matches');
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryGold,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: const Text(
                      'View Match & Chat',
                      style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text(
                    'Keep Browsing',
                    style: TextStyle(
                      color: AppTheme.textSecondary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);
    final isVerified = authState.user?.isVerified ?? false;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.favorite_rounded, color: AppTheme.accentCrimson, size: 22),
            const SizedBox(width: 8),
            const Text('SOVEREIGN'),
            const SizedBox(width: 8),
            if (isVerified)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppTheme.accentEmerald.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppTheme.accentEmerald, width: 1),
                ),
                child: const Text(
                  'VERIFIED',
                  style: TextStyle(
                    color: AppTheme.accentEmerald,
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              )
            else
              InkWell(
                onTap: () => context.push('/verification/prompt'),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryGold.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppTheme.primaryGold, width: 1),
                  ),
                  child: const Text(
                    'PREVIEW',
                    style: TextStyle(
                      color: AppTheme.primaryGold,
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined, color: AppTheme.textSecondary),
            onPressed: () => context.push('/app/notifications'),
          ),
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: AppTheme.textSecondary),
            onPressed: _fetchFeed,
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 20),
          child: _buildBody(isVerified),
        ),
      ),
    );
  }

  Widget _buildBody(bool isVerified) {
    if (_isLoading) {
      return const LoadingIndicator(message: 'Discovering verified profiles...');
    }

    if (_errorMessage != null) {
      return ErrorView(
        message: _errorMessage!,
        onRetry: _fetchFeed,
      );
    }

    if (_currentIndex >= _profiles.length) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppTheme.darkCard,
                shape: BoxShape.circle,
                border: Border.all(color: AppTheme.darkCardBorder),
              ),
              child: const Icon(
                Icons.check_circle_outline_rounded,
                size: 52,
                color: AppTheme.primaryGold,
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              "You're All Caught Up!",
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w800,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 32),
              child: Text(
                'No more new candidates matching your preferences right now. Check back soon as new verified users join.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14,
                  color: AppTheme.textSecondary,
                  height: 1.4,
                ),
              ),
            ),
            const SizedBox(height: 28),
            OutlinedButton.icon(
              onPressed: _fetchFeed,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Refresh Feed'),
            ),
          ],
        ),
      );
    }

    final currentProfile = _profiles[_currentIndex];

    return Dismissible(
      key: ValueKey('${currentProfile.userId}_$_currentIndex'),
      direction: isVerified ? DismissDirection.horizontal : DismissDirection.none,
      onDismissed: (direction) {
        if (direction == DismissDirection.startToEnd) {
          _handleLike();
        } else {
          _handlePass();
        }
      },
      background: Container(
        alignment: Alignment.centerLeft,
        padding: const EdgeInsets.only(left: 32),
        decoration: BoxDecoration(
          color: AppTheme.accentEmerald.withOpacity(0.15),
          borderRadius: BorderRadius.circular(28),
        ),
        child: const Icon(Icons.favorite_rounded, color: AppTheme.accentEmerald, size: 48),
      ),
      secondaryBackground: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 32),
        decoration: BoxDecoration(
          color: AppTheme.accentCoral.withOpacity(0.15),
          borderRadius: BorderRadius.circular(28),
        ),
        child: const Icon(Icons.close_rounded, color: AppTheme.accentCoral, size: 48),
      ),
      child: DiscoveryCard(
        profile: currentProfile,
        isUnverifiedPreview: !isVerified,
        onLike: _handleLike,
        onPass: _handlePass,
        onVerifyPrompt: () => context.push('/verification/prompt'),
      ),
    );
  }
}
