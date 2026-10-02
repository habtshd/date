import 'dart:ui';
import 'package:flutter/material.dart';
import '../../../../app/theme.dart';
import '../../domain/discovery_profile.dart';

class DiscoveryCard extends StatefulWidget {
  final DiscoveryProfile profile;
  final bool isUnverifiedPreview;
  final VoidCallback? onLike;
  final VoidCallback? onPass;
  final VoidCallback? onVerifyPrompt;

  const DiscoveryCard({
    super.key,
    required this.profile,
    this.isUnverifiedPreview = false,
    this.onLike,
    this.onPass,
    this.onVerifyPrompt,
  });

  @override
  State<DiscoveryCard> createState() => _DiscoveryCardState();
}

class _DiscoveryCardState extends State<DiscoveryCard> {
  bool _isDetailsRevealed = false;

  void _toggleDetails() {
    setState(() {
      _isDetailsRevealed = !_isDetailsRevealed;
    });
  }

  @override
  Widget build(BuildContext context) {
    final profile = widget.profile;

    return Container(
      decoration: BoxDecoration(
        color: AppTheme.darkCard,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: AppTheme.darkCardBorder, width: 1.2),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primaryGold.withOpacity(0.12),
            blurRadius: 36,
            spreadRadius: 1,
            offset: const Offset(0, 10),
          ),
          const BoxShadow(
            color: Color(0x120F172A),
            blurRadius: 24,
            offset: Offset(0, 8),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Background / Profile Image
          _buildProfileImage(),

          // Delicate top vignette for status/header contrast
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.black.withOpacity(0.20),
                  Colors.transparent,
                ],
                stops: const [0.0, 0.16],
              ),
            ),
          ),

          // Top Preview Mode Notice: Glowing Translucent Glass Pill
          if (widget.isUnverifiedPreview)
            Positioned(
              top: 14,
              left: 14,
              right: 14,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(18),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          Colors.white.withOpacity(0.70),
                          Colors.white.withOpacity(0.40),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(
                        color: Colors.white.withOpacity(0.85),
                        width: 1.3,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.primaryGold.withOpacity(0.22),
                          blurRadius: 20,
                          offset: const Offset(0, 4),
                        ),
                        const BoxShadow(
                          color: Color(0x100F172A),
                          blurRadius: 12,
                          offset: Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: AppTheme.primaryGold.withOpacity(0.18),
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: AppTheme.primaryGold.withOpacity(0.3),
                                blurRadius: 6,
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.lock_rounded,
                            color: AppTheme.primaryGold,
                            size: 16,
                          ),
                        ),
                        const SizedBox(width: 10),
                        const Expanded(
                          child: Text(
                            'Preview Mode • Verify with Fayda to unlock',
                            style: TextStyle(
                              color: AppTheme.textPrimary,
                              fontSize: 12,
                              fontWeight: FontWeight.w800,
                              letterSpacing: -0.1,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [
                                Color(0xFFFBBF24),
                                Color(0xFFD97706),
                              ],
                            ),
                            borderRadius: BorderRadius.circular(10),
                            boxShadow: [
                              BoxShadow(
                                color: AppTheme.primaryGold.withOpacity(0.45),
                                blurRadius: 10,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Material(
                            color: Colors.transparent,
                            child: InkWell(
                              onTap: widget.onVerifyPrompt,
                              borderRadius: BorderRadius.circular(10),
                              child: const Padding(
                                padding: EdgeInsets.symmetric(
                                    horizontal: 12, vertical: 6),
                                child: Text(
                                  'Verify',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w800,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),

          // Bottom Content: Seamless Gradient Transparent Overlay
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    Colors.white.withOpacity(0.0),
                    Colors.white.withOpacity(_isDetailsRevealed ? 0.40 : 0.22),
                    Colors.white.withOpacity(_isDetailsRevealed ? 0.78 : 0.60),
                    Colors.white.withOpacity(_isDetailsRevealed ? 0.94 : 0.88),
                    Colors.white.withOpacity(0.98),
                  ],
                  stops: const [0.0, 0.12, 0.35, 0.58, 0.80, 1.0],
                ),
              ),
              padding: const EdgeInsets.fromLTRB(20, 28, 20, 22),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Simplified Name Header with '>' Button
                  InkWell(
                    onTap: _toggleDetails,
                    borderRadius: BorderRadius.circular(14),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(
                        children: [
                          Expanded(
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Flexible(
                                  child: Text(
                                    profile.firstName,
                                    style: TextStyle(
                                      fontSize: 28,
                                      fontWeight: FontWeight.w900,
                                      color: AppTheme.textPrimary,
                                      letterSpacing: -0.5,
                                      shadows: [
                                        Shadow(
                                          color: Colors.white.withOpacity(0.9),
                                          blurRadius: 12,
                                          offset: const Offset(0, 1),
                                        ),
                                      ],
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                if (profile.isVerified)
                                  Container(
                                    padding: const EdgeInsets.all(4),
                                    decoration: BoxDecoration(
                                      color: AppTheme.accentEmerald,
                                      shape: BoxShape.circle,
                                      boxShadow: [
                                        BoxShadow(
                                          color: AppTheme.accentEmerald
                                              .withOpacity(0.6),
                                          blurRadius: 10,
                                          spreadRadius: 1,
                                        ),
                                      ],
                                    ),
                                    child: const Icon(
                                      Icons.check_rounded,
                                      size: 14,
                                      color: Colors.white,
                                    ),
                                  ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                          // '>' Chevron Button to Reveal Details
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.85),
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: Colors.white,
                                width: 1.5,
                              ),
                              boxShadow: const [
                                BoxShadow(
                                  color: Color(0x140F172A),
                                  blurRadius: 10,
                                  offset: Offset(0, 3),
                                ),
                              ],
                            ),
                            child: AnimatedRotation(
                              turns: _isDetailsRevealed ? 0.25 : 0.0,
                              duration: const Duration(milliseconds: 250),
                              child: const Icon(
                                Icons.arrow_forward_ios_rounded,
                                size: 15,
                                color: AppTheme.textPrimary,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Animated Reveal Section: Age, Location, Goal, Bio, and Interests
                  AnimatedSize(
                    duration: const Duration(milliseconds: 280),
                    curve: Curves.easeOutCubic,
                    child: _isDetailsRevealed
                        ? Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const SizedBox(height: 8),
                              // Age, Location & Goal Tags Row
                              Wrap(
                                spacing: 8,
                                runSpacing: 6,
                                children: [
                                  // Age Tag
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: Colors.white.withOpacity(0.85),
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(
                                        color: const Color(0xFFE2E8F0),
                                      ),
                                    ),
                                    child: Text(
                                      '${profile.age} years old',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w700,
                                        color: AppTheme.textPrimary,
                                      ),
                                    ),
                                  ),
                                  // Location Tag
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: Colors.white.withOpacity(0.85),
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(
                                        color: const Color(0xFFE2E8F0),
                                      ),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const Icon(
                                          Icons.location_on_rounded,
                                          size: 13,
                                          color: AppTheme.primaryGold,
                                        ),
                                        const SizedBox(width: 4),
                                        Text(
                                          profile.city,
                                          style: const TextStyle(
                                            fontSize: 12,
                                            color: AppTheme.textSecondary,
                                            fontWeight: FontWeight.w700,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  // Goal Tag
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFFEF3C7)
                                          .withOpacity(0.85),
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(
                                        color: const Color(0xFFF59E0B)
                                            .withOpacity(0.6),
                                        width: 1,
                                      ),
                                      boxShadow: [
                                        BoxShadow(
                                          color: const Color(0xFFF59E0B)
                                              .withOpacity(0.25),
                                          blurRadius: 8,
                                        ),
                                      ],
                                    ),
                                    child: Text(
                                      profile.relationshipGoal
                                          .replaceAll('_', ' '),
                                      style: const TextStyle(
                                        fontSize: 10.5,
                                        fontWeight: FontWeight.w900,
                                        color: Color(0xFF92400E),
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                                  ),
                                ],
                              ),

                              if (profile.bio != null &&
                                  profile.bio!.isNotEmpty) ...[
                                const SizedBox(height: 10),
                                Text(
                                  profile.bio!,
                                  style: const TextStyle(
                                    fontSize: 13.5,
                                    color: Color(0xFF1E293B),
                                    height: 1.4,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],

                              // Interest Chips
                              if (profile.interests.isNotEmpty) ...[
                                const SizedBox(height: 12),
                                Wrap(
                                  spacing: 8,
                                  runSpacing: 8,
                                  children: profile.interests.map((interest) {
                                    return Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 12, vertical: 6),
                                      decoration: BoxDecoration(
                                        color:
                                            Colors.white.withOpacity(0.82),
                                        borderRadius:
                                            BorderRadius.circular(12),
                                        border: Border.all(
                                          color: Colors.white,
                                          width: 1.5,
                                        ),
                                        boxShadow: [
                                          const BoxShadow(
                                            color: Color(0x100F172A),
                                            blurRadius: 8,
                                            offset: Offset(0, 2),
                                          ),
                                          BoxShadow(
                                            color: Colors.white
                                                .withOpacity(0.6),
                                            blurRadius: 6,
                                            spreadRadius: -1,
                                          ),
                                        ],
                                      ),
                                      child: Text(
                                        interest,
                                        style: const TextStyle(
                                          fontSize: 11.5,
                                          color: Color(0xFF0F172A),
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                    );
                                  }).toList(),
                                ),
                              ],
                            ],
                          )
                        : const SizedBox.shrink(),
                  ),

                  const SizedBox(height: 16),

                  // Action Button: Glowing Amber Radiant Button or Pass/Like
                  if (widget.isUnverifiedPreview) ...[
                    Container(
                      width: double.infinity,
                      height: 52,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [
                            Color(0xFFFBBF24), // Radiant warm gold
                            Color(0xFFD97706), // Ethiopian amber
                            Color(0xFFB45309), // Bronze amber
                          ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: Colors.white.withOpacity(0.4),
                          width: 1,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFFD97706).withOpacity(0.50),
                            blurRadius: 22,
                            spreadRadius: 1,
                            offset: const Offset(0, 6),
                          ),
                          BoxShadow(
                            color: Colors.white.withOpacity(0.3),
                            blurRadius: 8,
                            offset: const Offset(0, -1),
                          ),
                        ],
                      ),
                      child: Material(
                        color: Colors.transparent,
                        child: InkWell(
                          onTap: widget.onVerifyPrompt,
                          borderRadius: BorderRadius.circular(16),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(5),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.25),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(
                                  Icons.verified_user_rounded,
                                  size: 18,
                                  color: Colors.white,
                                ),
                              ),
                              const SizedBox(width: 10),
                              const Text(
                                'Verify Fayda ID to Like',
                                style: TextStyle(
                                  fontWeight: FontWeight.w800,
                                  fontSize: 15,
                                  color: Colors.white,
                                  letterSpacing: 0.3,
                                  shadows: [
                                    Shadow(
                                      color: Color(0x33000000),
                                      blurRadius: 4,
                                      offset: Offset(0, 1),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ] else ...[
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        // Pass Button
                        Container(
                          width: 60,
                          height: 60,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white,
                            border: Border.all(
                              color: const Color(0xFFE2E8F0),
                              width: 1.5,
                            ),
                            boxShadow: const [
                              BoxShadow(
                                color: Color(0x180F172A),
                                blurRadius: 16,
                                offset: Offset(0, 6),
                              ),
                            ],
                          ),
                          child: Material(
                            color: Colors.transparent,
                            child: InkWell(
                              onTap: widget.onPass,
                              borderRadius: BorderRadius.circular(32),
                              child: const Icon(
                                Icons.close_rounded,
                                color: Color(0xFF64748B),
                                size: 30,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 24),
                        // Glowing Like Button
                        Container(
                          width: 68,
                          height: 68,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: const LinearGradient(
                              colors: [
                                Color(0xFFFF3366),
                                Color(0xFFFF5E3A),
                                Color(0xFFFBBF24),
                              ],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            border: Border.all(
                              color: Colors.white.withOpacity(0.6),
                              width: 1.5,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFFFF3366).withOpacity(0.55),
                                blurRadius: 24,
                                spreadRadius: 2,
                                offset: const Offset(0, 6),
                              ),
                            ],
                          ),
                          child: Material(
                            color: Colors.transparent,
                            child: InkWell(
                              onTap: widget.onLike,
                              borderRadius: BorderRadius.circular(36),
                              child: const Icon(
                                Icons.favorite_rounded,
                                color: Colors.white,
                                size: 34,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileImage() {
    final photoUrl = widget.profile.primaryPhotoUrl;

    if (photoUrl != null && photoUrl.startsWith('http')) {
      return Image.network(
        photoUrl,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => _buildFallbackImage(),
      );
    }

    return _buildFallbackImage();
  }

  Widget _buildFallbackImage() {
    return Container(
      color: const Color(0xFFF1F5F9),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppTheme.primaryGold.withOpacity(0.12),
                border: Border.all(
                  color: AppTheme.primaryGold.withOpacity(0.3),
                  width: 2,
                ),
              ),
              child: const Icon(
                Icons.person_rounded,
                size: 58,
                color: AppTheme.primaryGold,
              ),
            ),
            const SizedBox(height: 14),
            Text(
              widget.profile.firstName,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppTheme.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
