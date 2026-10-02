import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../../app/theme.dart';
import '../data/posts_repository.dart';

class PhotoPreset {
  final String label;
  final String icon;
  final String url;

  const PhotoPreset({
    required this.label,
    required this.icon,
    required this.url,
  });
}

class CreatePostScreen extends ConsumerStatefulWidget {
  const CreatePostScreen({super.key});

  @override
  ConsumerState<CreatePostScreen> createState() => _CreatePostScreenState();
}

class _CreatePostScreenState extends ConsumerState<CreatePostScreen> {
  final _contentController = TextEditingController();
  final _picker = ImagePicker();

  String _selectedCategory = 'Date Idea';
  bool _isSubmitting = false;

  // Photo state
  String? _selectedImageUrl;
  Uint8List? _selectedImageBytes;
  String? _selectedImageLabel;

  final List<String> _categories = [
    'Date Idea',
    'Deep Thought',
    'Coffee & Culture',
    'Weekend Plan',
    'Question',
  ];

  final Map<String, String> _categoryIcons = {
    'Date Idea': '💡',
    'Deep Thought': '💭',
    'Coffee & Culture': '☕',
    'Weekend Plan': '🎯',
    'Question': '✨',
  };

  static const List<PhotoPreset> _photoPresets = [
    PhotoPreset(
      label: 'Buna Ceremony',
      icon: '☕',
      url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1000&q=80',
    ),
    PhotoPreset(
      label: 'Entoto Sunrise',
      icon: '🌅',
      url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80',
    ),
    PhotoPreset(
      label: 'Lake Bishoftu',
      icon: '🌊',
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
    ),
    PhotoPreset(
      label: 'Fendika Jazz',
      icon: '🎷',
      url: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1000&q=80',
    ),
    PhotoPreset(
      label: 'Addis Skyline',
      icon: '🏙️',
      url: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=1000&q=80',
    ),
  ];

  @override
  void dispose() {
    _contentController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    try {
      final XFile? file = await _picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1400,
        maxHeight: 1400,
        imageQuality: 85,
      );

      if (file == null) return;

      final bytes = await file.readAsBytes();
      final mime = file.name.toLowerCase().endsWith('.png')
          ? 'image/png'
          : 'image/jpeg';
      final dataUri = 'data:$mime;base64,${base64Encode(bytes)}';

      setState(() {
        _selectedImageBytes = bytes;
        _selectedImageUrl = dataUri;
        _selectedImageLabel = file.name;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Could not attach image: $e'),
            backgroundColor: AppTheme.accentCoral,
          ),
        );
      }
    }
  }

  void _selectPreset(PhotoPreset preset) {
    setState(() {
      _selectedImageBytes = null;
      _selectedImageUrl = preset.url;
      _selectedImageLabel = '${preset.icon} ${preset.label}';
    });
  }

  void _removePhoto() {
    setState(() {
      _selectedImageUrl = null;
      _selectedImageBytes = null;
      _selectedImageLabel = null;
    });
  }

  Future<void> _showCustomUrlDialog() async {
    final urlController = TextEditingController();
    final result = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.link_rounded, color: AppTheme.primaryGold),
            SizedBox(width: 8),
            Text(
              'Add Photo via Link',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: AppTheme.textPrimary,
              ),
            ),
          ],
        ),
        content: TextField(
          controller: urlController,
          autofocus: true,
          decoration: InputDecoration(
            hintText: 'https://example.com/photo.jpg',
            hintStyle: const TextStyle(color: AppTheme.textMuted, fontSize: 14),
            filled: true,
            fillColor: AppTheme.inputBackground,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppTheme.darkCardBorder),
            ),
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel', style: TextStyle(color: AppTheme.textSecondary)),
          ),
          ElevatedButton(
            onPressed: () {
              final link = urlController.text.trim();
              if (link.isNotEmpty) {
                Navigator.pop(context, link);
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryGold,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Attach'),
          ),
        ],
      ),
    );

    if (result != null && result.isNotEmpty) {
      setState(() {
        _selectedImageUrl = result;
        _selectedImageBytes = null;
        _selectedImageLabel = 'Web Image';
      });
    }
  }

  Future<void> _submitPost() async {
    final text = _contentController.text.trim();
    if (text.length < 8 && (_selectedImageUrl == null || _selectedImageUrl!.isEmpty)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please write an idea or attach a photo to share.'),
          backgroundColor: AppTheme.accentCoral,
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final repo = ref.read(postsRepositoryProvider);
      await repo.createPost(
        content: text.isNotEmpty ? text : 'Check out this date photo! ✨',
        category: _selectedCategory,
        imageUrl: _selectedImageUrl,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Your post has been shared with the community! 🎉'),
            backgroundColor: AppTheme.accentEmerald,
          ),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to publish post: $e'),
            backgroundColor: AppTheme.accentCoral,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('New Post'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Center(
              child: SizedBox(
                height: 38,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : _submitPost,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryGold,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 18),
                    minimumSize: Size.zero,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: _isSubmitting
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text(
                          'Post',
                          style: TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 14,
                          ),
                        ),
                ),
              ),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Topic / Category Selector
              const Text(
                'CHOOSE A TOPIC',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.primaryGold,
                  letterSpacing: 1.2,
                ),
              ),
              const SizedBox(height: 10),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: _categories.map((category) {
                    final isSelected = _selectedCategory == category;
                    final icon = _categoryIcons[category] ?? '💡';

                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text('$icon $category'),
                        selected: isSelected,
                        onSelected: (selected) {
                          if (selected) {
                            setState(() => _selectedCategory = category);
                          }
                        },
                        selectedColor: const Color(0xFFFEF3C7),
                        backgroundColor: AppTheme.inputBackground,
                        labelStyle: TextStyle(
                          fontSize: 13,
                          fontWeight:
                              isSelected ? FontWeight.w800 : FontWeight.w600,
                          color: isSelected
                              ? const Color(0xFFB45309)
                              : AppTheme.textSecondary,
                        ),
                        side: BorderSide(
                          color: isSelected
                              ? AppTheme.primaryGold
                              : AppTheme.darkCardBorder,
                          width: isSelected ? 1.5 : 1,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),

              const SizedBox(height: 20),

              // Content Input Field
              Container(
                decoration: BoxDecoration(
                  color: AppTheme.darkCard,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppTheme.darkCardBorder),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x080F172A),
                      blurRadius: 16,
                      offset: Offset(0, 4),
                    ),
                  ],
                ),
                padding: const EdgeInsets.all(16),
                child: TextField(
                  controller: _contentController,
                  maxLines: 5,
                  maxLength: 350,
                  style: const TextStyle(
                    fontSize: 16,
                    color: AppTheme.textPrimary,
                    height: 1.5,
                  ),
                  decoration: InputDecoration(
                    hintText: _getPlaceholderForCategory(_selectedCategory),
                    hintStyle: const TextStyle(
                      color: AppTheme.textMuted,
                      fontSize: 15,
                    ),
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    filled: false,
                    contentPadding: EdgeInsets.zero,
                  ),
                  onChanged: (_) => setState(() {}),
                ),
              ),

              const SizedBox(height: 22),

              // Photo Section
              _buildPhotoSection(),

              const SizedBox(height: 22),

              // Inspiration Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.darkCardBorder),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryGold.withOpacity(0.12),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.tips_and_updates_rounded,
                        color: AppTheme.primaryGold,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Photos spark 3x more replies',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w800,
                              color: AppTheme.textPrimary,
                            ),
                          ),
                          SizedBox(height: 2),
                          Text(
                            'Attach a photo of your favorite date venue, Ethiopian coffee ritual, or a place in Addis you would love to visit together.',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppTheme.textSecondary,
                              height: 1.4,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 26),

              // Publish CTA
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton.icon(
                  onPressed: _isSubmitting ? null : _submitPost,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryGold,
                    foregroundColor: Colors.white,
                    elevation: 2,
                    shadowColor: AppTheme.primaryGold.withOpacity(0.35),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  icon: const Icon(Icons.send_rounded, size: 18),
                  label: _isSubmitting
                      ? const Text('Publishing...')
                      : const Text(
                          'Share with Community',
                          style: TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 15,
                          ),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPhotoSection() {
    final hasPhoto = _selectedImageUrl != null && _selectedImageUrl!.isNotEmpty;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'ATTACH A PHOTO',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w800,
                color: AppTheme.primaryGold,
                letterSpacing: 1.2,
              ),
            ),
            if (!hasPhoto)
              TextButton.icon(
                onPressed: _showCustomUrlDialog,
                style: TextButton.styleFrom(
                  padding: EdgeInsets.zero,
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                icon: const Icon(Icons.link_rounded, size: 14, color: AppTheme.primaryGold),
                label: const Text(
                  'Paste Link',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.primaryGold,
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 10),

        if (hasPhoto)
          _buildAttachedPhotoPreview()
        else
          Column(
            children: [
              // Main Pick from Gallery Container
              InkWell(
                onTap: _pickImage,
                borderRadius: BorderRadius.circular(18),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 22, horizontal: 16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFAFBFD),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: AppTheme.primaryGold.withOpacity(0.35),
                      width: 1.5,
                      strokeAlign: BorderSide.strokeAlignInside,
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryGold.withOpacity(0.12),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.add_photo_alternate_rounded,
                          color: AppTheme.primaryGold,
                          size: 24,
                        ),
                      ),
                      const SizedBox(width: 14),
                      const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Choose Photo from Device',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                              color: AppTheme.textPrimary,
                            ),
                          ),
                          SizedBox(height: 2),
                          Text(
                            'Upload JPEG, PNG or WebP picture',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppTheme.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 14),

              // Date Photo Inspirations (Horizontal presets)
              Row(
                children: [
                  const Icon(Icons.auto_awesome_rounded,
                      size: 13, color: AppTheme.textMuted),
                  const SizedBox(width: 5),
                  const Text(
                    'Or quick-select popular date spot photos:',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textMuted,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: _photoPresets.map((preset) {
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ActionChip(
                        avatar: ClipRRect(
                          borderRadius: BorderRadius.circular(6),
                          child: Image.network(
                            preset.url,
                            width: 22,
                            height: 22,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) =>
                                Text(preset.icon, style: const TextStyle(fontSize: 12)),
                          ),
                        ),
                        label: Text('${preset.icon} ${preset.label}'),
                        backgroundColor: Colors.white,
                        side: const BorderSide(color: AppTheme.darkCardBorder),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                        labelStyle: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.textPrimary,
                        ),
                        onPressed: () => _selectPreset(preset),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
      ],
    );
  }

  Widget _buildAttachedPhotoPreview() {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.darkCard,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppTheme.darkCardBorder),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0C0F172A),
            blurRadius: 16,
            offset: Offset(0, 4),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          // Image Display
          SizedBox(
            height: 200,
            width: double.infinity,
            child: _selectedImageBytes != null
                ? Image.memory(
                    _selectedImageBytes!,
                    fit: BoxFit.cover,
                  )
                : _selectedImageUrl!.startsWith('data:image')
                    ? _buildDataUriImage(_selectedImageUrl!)
                    : Image.network(
                        _selectedImageUrl!,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          color: const Color(0xFFF1F5F9),
                          child: const Center(
                            child: Icon(Icons.broken_image_rounded, size: 36),
                          ),
                        ),
                      ),
          ),

          // Top Gradient overlay for icons
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: 60,
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.black54, Colors.transparent],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
            ),
          ),

          // Label badge top-left
          Positioned(
            top: 12,
            left: 12,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.65),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.photo_rounded, color: Colors.white, size: 14),
                  const SizedBox(width: 6),
                  Text(
                    _selectedImageLabel ?? 'Photo Attached',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Action buttons top-right (Edit & Remove)
          Positioned(
            top: 10,
            right: 10,
            child: Row(
              children: [
                InkWell(
                  onTap: _pickImage,
                  child: Container(
                    padding: const EdgeInsets.all(7),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.65),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.edit_rounded,
                      color: Colors.white,
                      size: 16,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                InkWell(
                  onTap: _removePhoto,
                  child: Container(
                    padding: const EdgeInsets.all(7),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.65),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.close_rounded,
                      color: Colors.white,
                      size: 16,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDataUriImage(String uri) {
    try {
      final comma = uri.indexOf(',');
      if (comma != -1) {
        final b64 = uri.substring(comma + 1);
        final bytes = base64Decode(b64);
        return Image.memory(bytes, fit: BoxFit.cover);
      }
    } catch (_) {}
    return Container(
      color: const Color(0xFFF1F5F9),
      child: const Center(child: Icon(Icons.image_rounded, size: 36)),
    );
  }

  String _getPlaceholderForCategory(String category) {
    switch (category) {
      case 'Date Idea':
        return 'Describe your dream date! E.g. "Sunset Buna ceremony at Entoto followed by acoustic live music..."';
      case 'Deep Thought':
        return 'What are you seeking in a meaningful relationship? What traditions matter to you?';
      case 'Coffee & Culture':
        return 'Share your favorite Ethiopian cultural spot, coffee ritual, or local memory...';
      case 'Weekend Plan':
        return 'What are you doing this weekend? Invite someone with shared passions to join...';
      default:
        return 'Ask a thoughtful question to break the ice with compatible members...';
    }
  }
}
