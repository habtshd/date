import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import '../../../app/theme.dart';
import '../../../core/widgets/app_button.dart';
import '../data/profile_repository.dart';

class PhotosSetupScreen extends ConsumerStatefulWidget {
  const PhotosSetupScreen({super.key});

  @override
  ConsumerState<PhotosSetupScreen> createState() => _PhotosSetupScreenState();
}

class _PhotosSetupScreenState extends ConsumerState<PhotosSetupScreen> {
  final List<String> _photos = [];
  final ImagePicker _picker = ImagePicker();
  bool _isLoading = false;

  Future<void> _pickImage() async {
    setState(() => _isLoading = true);
    try {
      final XFile? image = await _picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1080,
        maxHeight: 1350,
        imageQuality: 85,
      );

      if (image != null) {
        setState(() {
          // For initial onboarding MVP, add the local path or data URL
          _photos.add(image.path);
        });

        // Register photo with backend
        try {
          await ref.read(profileRepositoryProvider).addPhoto(
                photoUrl: image.path,
                isPrimary: _photos.length == 1,
              );
        } catch (_) {
          // Keep local state for testing even if offline
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to select photo: $e'),
            backgroundColor: AppTheme.accentCoral,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _removePhoto(int index) {
    setState(() => _photos.removeAt(index));
  }

  void _finishSetup() {
    if (_photos.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please add at least one clear profile photo'),
          backgroundColor: AppTheme.accentCoral,
        ),
      );
      return;
    }

    context.go('/verification/prompt');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Add Photos (Step 3 of 3)'),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'Show Your Real Self',
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Upload at least one clear photo where your face is visible. High quality photos receive 4x more mutual likes.',
                style: TextStyle(fontSize: 13, color: AppTheme.textSecondary, height: 1.4),
              ),
              const SizedBox(height: 28),
              Expanded(
                child: GridView.builder(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 0.8,
                  ),
                  itemCount: 6,
                  itemBuilder: (context, index) {
                    if (index < _photos.length) {
                      return Stack(
                        fit: StackFit.expand,
                        children: [
                          Container(
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(16),
                              color: AppTheme.darkCard,
                              border: Border.all(
                                color: index == 0 ? AppTheme.primaryGold : AppTheme.darkCardBorder,
                                width: index == 0 ? 2.0 : 1.0,
                              ),
                            ),
                            clipBehavior: Clip.antiAlias,
                            child: Center(
                              child: Icon(
                                Icons.image_rounded,
                                size: 36,
                                color: AppTheme.primaryGold.withOpacity(0.7),
                              ),
                            ),
                          ),
                          if (index == 0)
                            Positioned(
                              bottom: 6,
                              left: 6,
                              right: 6,
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppTheme.primaryGold,
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: const Text(
                                  'PRIMARY',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    fontSize: 9,
                                    fontWeight: FontWeight.w900,
                                    color: Colors.black,
                                  ),
                                ),
                              ),
                            ),
                          Positioned(
                            top: 4,
                            right: 4,
                            child: InkWell(
                              onTap: () => _removePhoto(index),
                              child: Container(
                                padding: const EdgeInsets.all(4),
                                decoration: const BoxDecoration(
                                  color: Colors.black54,
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

                    return InkWell(
                      onTap: _pickImage,
                      borderRadius: BorderRadius.circular(16),
                      child: Container(
                        decoration: BoxDecoration(
                          color: AppTheme.inputBackground,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: AppTheme.darkCardBorder,
                            style: BorderStyle.solid,
                          ),
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: const [
                            Icon(
                              Icons.add_photo_alternate_outlined,
                              color: AppTheme.primaryGold,
                              size: 28,
                            ),
                            SizedBox(height: 6),
                            Text(
                              'Add',
                              style: TextStyle(
                                color: AppTheme.textSecondary,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
              AppButton(
                text: 'Finish Setup & Verify',
                isLoading: _isLoading,
                onPressed: _finishSetup,
                icon: Icons.verified_user_rounded,
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}
