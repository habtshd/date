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
  late final PageController _pageController;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _fetchFeed();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
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

        if (_pageController.hasClients) {
          _pageController.jumpToPage(0);
        }
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

  Future<void> _handleLike(DiscoveryProfile targetProfile) async {
    final repo = ref.read(discoveryRepositoryProvider);

    try {
      final result = await repo.likeUser(targetProfile.userId);

      if (mounted) {
        if (result.matched) {
          _showMatchDialog(targetProfile, result.conversationId);
        }
        _scrollToNext();
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

  Future<void> _handlePass(DiscoveryProfile targetProfile) async {
    final repo = ref.read(discoveryRepositoryProvider);

    try {
      await repo.passUser(targetProfile.userId);
    } catch (_) {}

    if (mounted) {
      _scrollToNext();
    }
  }

  void _scrollToNext() {
    if (_pageController.hasClients && _currentIndex < _profiles.length) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 380),
        curve: Curves.easeInOutCubic,
      );
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
            const Text('DATING'),
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
        child: _buildBody(isVerified),
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

    if (_profiles.isEmpty) {
      return _buildCaughtUpView();
    }

    return Stack(
      children: [
        PageView.builder(
          controller: _pageController,
          scrollDirection: Axis.vertical,
          physics: const BouncingScrollPhysics(),
          itemCount: _profiles.length + 1,
          onPageChanged: (index) {
            setState(() {
              _currentIndex = index;
            });
          },
          itemBuilder: (context, index) {
            if (index == _profiles.length) {
              return Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 20),
                child: _buildCaughtUpView(),
              );
            }

            final currentProfile = _profiles[index];

            return Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
              child: DiscoveryCard(
                key: ValueKey(currentProfile.userId),
                profile: currentProfile,
                isUnverifiedPreview: !isVerified,
                onLike: () => _handleLike(currentProfile),
                onPass: () => _handlePass(currentProfile),
                onVerifyPrompt: () => context.push('/verification/prompt'),
              ),
            );
          },
        ),

        // Vertical Dots Page Indicator on Right Edge
        if (_profiles.length > 1 && _currentIndex < _profiles.length)
          Positioned(
            right: 8,
            top: 0,
            bottom: 0,
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.80),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.white, width: 1.2),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x120F172A),
                      blurRadius: 10,
                      offset: Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: List.generate(_profiles.length, (i) {
                    final isCurrent = i == _currentIndex;
                    return AnimatedContainer(
                      duration: const Duration(milliseconds: 250),
                      margin: const EdgeInsets.symmetric(vertical: 3),
                      width: 5,
                      height: isCurrent ? 18 : 5,
                      decoration: BoxDecoration(
                        color: isCurrent
                            ? AppTheme.primaryGold
                            : const Color(0xFFCBD5E1),
                        borderRadius: BorderRadius.circular(3),
                      ),
                    );
                  }),
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildCaughtUpView() {
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
              boxShadow: const [
                BoxShadow(
                  color: Color(0x100F172A),
                  blurRadius: 16,
                  offset: Offset(0, 4),
                ),
              ],
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
}
