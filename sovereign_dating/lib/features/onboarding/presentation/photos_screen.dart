import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import '../../../app/theme.dart';
import '../../../core/widgets/app_button.dart';
import 'controllers/onboarding_controllers.dart';

class PhotosScreen extends ConsumerStatefulWidget {
  const PhotosScreen({super.key});

  @override
  ConsumerState<PhotosScreen> createState() => _PhotosScreenState();
}

class _PhotosScreenState extends ConsumerState<PhotosScreen> {
  final ImagePicker _picker = ImagePicker();
  bool _isUploading = false;

  Future<void> _pickAndUploadPhoto() async {
    final state = ref.read(photosControllerProvider);
    if (state.photos.length >= 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('You can add up to 6 photos.'),
          backgroundColor: AppTheme.accentCoral,
        ),
      );
      return;
    }

    try {
      final XFile? image = await _picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1200,
        maxHeight: 1600,
        imageQuality: 85,
      );

      if (image == null) return;

      setState(() => _isUploading = true);

      final bytes = await image.readAsBytes();
      String contentType = 'image/jpeg';
      if (image.path.endsWith('.png')) contentType = 'image/png';
      if (image.path.endsWith('.webp')) contentType = 'image/webp';

      final success = await ref.read(photosControllerProvider.notifier).uploadPhoto(
            bytes: bytes,
            contentType: contentType,
          );

      if (mounted) {
        if (!success) {
          final err = ref.read(photosControllerProvider).error ??
              'Failed to upload photo. Try again.';
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(err), backgroundColor: AppTheme.accentCoral),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Photo selection failed: $e'),
            backgroundColor: AppTheme.accentCoral,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isUploading = false);
    }
  }

  void _handleContinue() {
    final state = ref.read(photosControllerProvider);
    if (state.photos.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please add at least 1 clear photo of yourself.'),
          backgroundColor: AppTheme.accentCoral,
        ),
      );
      return;
    }

    context.push('/onboarding/preview');
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(photosControllerProvider);
    final controller = ref.read(photosControllerProvider.notifier);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile Photos'),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildStepHeader(
                step: 4,
                totalSteps: 5,
                title: 'Add Your Photos',
                subtitle: 'Add clear photos showing your face. Tap a photo to set as primary.',
              ),
              const SizedBox(height: 20),

              // Photo Grid (6 slots)
              Expanded(
                child: GridView.builder(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 0.78,
                  ),
                  itemCount: 6,
                  itemBuilder: (context, index) {
                    if (index < state.photos.length) {
                      final photo = state.photos[index];
                      return _buildPhotoTile(
                        photoUrl: photo.url,
                        isPrimary: photo.isPrimary,
                        onSetPrimary: () => controller.setPrimary(photo.id),
                        onDelete: () => controller.deletePhoto(photo.id),
                      );
                    }

                    // Empty / Add slot
                    final isNextSlot = index == state.photos.length;
                    return InkWell(
                      onTap: isNextSlot && !_isUploading ? _pickAndUploadPhoto : null,
                      borderRadius: BorderRadius.circular(16),
                      child: Container(
                        decoration: BoxDecoration(
                          color: AppTheme.inputBackground,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: isNextSlot
                                ? AppTheme.primaryGold.withValues(alpha: 0.6)
                                : AppTheme.darkCardBorder,
                            width: isNextSlot ? 1.5 : 1.0,
                          ),
                        ),
                        child: Center(
                          child: isNextSlot && _isUploading
                              ? const SizedBox(
                                  width: 24,
                                  height: 24,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    valueColor: AlwaysStoppedAnimation<Color>(
                                        AppTheme.primaryGold),
                                  ),
                                )
                              : Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      Icons.add_photo_alternate_rounded,
                                      size: 30,
                                      color: isNextSlot
                                          ? AppTheme.primaryGold
                                          : AppTheme.textMuted,
                                    ),
                                    const SizedBox(height: 6),
                                    Text(
                                      isNextSlot ? 'Add' : '',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                        color: AppTheme.primaryGold,
                                      ),
                                    ),
                                  ],
                                ),
                        ),
                      ),
                    );
                  },
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
                text: 'Review Profile',
                isLoading: _isUploading,
                onPressed: _handleContinue,
                icon: Icons.check_circle_outline_rounded,
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPhotoTile({
    required String photoUrl,
    required bool isPrimary,
    required VoidCallback onSetPrimary,
    required VoidCallback onDelete,
  }) {
    return Stack(
      fit: StackFit.expand,
      children: [
        GestureDetector(
          onTap: onSetPrimary,
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isPrimary ? AppTheme.primaryGold : AppTheme.darkCardBorder,
                width: isPrimary ? 2.5 : 1.0,
              ),
              color: AppTheme.darkCard,
            ),
            clipBehavior: Clip.antiAlias,
            child: photoUrl.startsWith('http')
                ? Image.network(
                    photoUrl,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => _buildFallbackPhoto(),
                  )
                : _buildFallbackPhoto(),
          ),
        ),

        // Primary Badge
        if (isPrimary)
          Positioned(
            bottom: 8,
            left: 8,
            right: 8,
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 3),
              decoration: BoxDecoration(
                color: AppTheme.primaryGold,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text(
                'PRIMARY ★',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  color: Colors.black,
                  letterSpacing: 0.5,
                ),
              ),
            ),
          ),

        // Delete Button
        Positioned(
          top: 6,
          right: 6,
          child: InkWell(
            onTap: onDelete,
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: const BoxDecoration(
                color: Colors.black87,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.close_rounded,
                size: 14,
                color: Colors.white,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildFallbackPhoto() {
    return Container(
      color: AppTheme.darkSurface,
      child: const Center(
        child: Icon(
          Icons.person_rounded,
          size: 40,
          color: AppTheme.primaryGold,
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
