import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../app/theme.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';
import '../data/profile_repository.dart';
import '../domain/profile_model.dart';
import '../../auth/data/auth_repository.dart';

class ProfileSetupScreen extends ConsumerStatefulWidget {
  const ProfileSetupScreen({super.key});

  @override
  ConsumerState<ProfileSetupScreen> createState() => _ProfileSetupScreenState();
}

class _ProfileSetupScreenState extends ConsumerState<ProfileSetupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameController = TextEditingController();
  final _bioController = TextEditingController();

  DateTime _selectedDob = DateTime(1998, 1, 1);
  String _selectedGender = 'FEMALE';
  String _selectedCity = 'Addis Ababa';
  String _selectedGoal = 'MARRIAGE';
  bool _isLoading = false;

  final List<String> _cities = [
    'Addis Ababa',
    'Hawassa',
    'Bahir Dar',
    'Dire Dawa',
    'Gondar',
    'Mekelle',
    'Adama',
    'Bishoftu',
    'Jimma',
  ];

  final List<Map<String, String>> _goals = [
    {'key': 'MARRIAGE', 'label': 'Marriage / Long-term'},
    {'key': 'SERIOUS', 'label': 'Serious Relationship'},
    {'key': 'DATING', 'label': 'Dating & Romance'},
    {'key': 'FRIENDSHIP', 'label': 'Friendship & Networking'},
  ];

  @override
  void dispose() {
    _firstNameController.dispose();
    _bioController.dispose();
    super.dispose();
  }

  Future<void> _pickDateOfBirth() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDob,
      firstDate: DateTime(1950),
      lastDate: DateTime.now().subtract(const Duration(days: 365 * 18)),
      builder: (context, child) {
        return Theme(
          data: AppTheme.darkTheme.copyWith(
            colorScheme: const ColorScheme.dark(
              primary: AppTheme.primaryGold,
              surface: AppTheme.darkCard,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() => _selectedDob = picked);
    }
  }

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final profile = UserProfileModel(
        firstName: _firstNameController.text.trim(),
        dateOfBirth: _selectedDob,
        gender: _selectedGender,
        city: _selectedCity,
        bio: _bioController.text.trim().isNotEmpty ? _bioController.text.trim() : null,
        relationshipGoal: _selectedGoal,
      );

      await ref.read(profileRepositoryProvider).saveProfile(profile);

      // Update local auth user state with profile created
      final currentAuth = ref.read(authStateProvider);
      if (currentAuth.user != null) {
        ref.read(authStateProvider.notifier).updateUser(
              currentAuth.user!.copyWith(hasProfile: true),
            );
      }

      if (mounted) {
        context.push('/onboarding/preferences');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to save profile: $e'),
            backgroundColor: AppTheme.accentCoral,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Create Profile (Step 1 of 3)'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  'About You',
                  style: TextStyle(
                    fontSize: 26,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Share your basic details. Your privacy is paramount: full legal names and ID numbers remain encrypted in the vault.',
                  style: TextStyle(fontSize: 13, color: AppTheme.textSecondary, height: 1.4),
                ),
                const SizedBox(height: 28),
                AppTextField(
                  controller: _firstNameController,
                  label: 'First Name',
                  hint: 'Sara',
                  prefixIcon: Icons.person_outline_rounded,
                  validator: (v) =>
                      v == null || v.trim().isEmpty ? 'Please enter first name' : null,
                ),
                const SizedBox(height: 20),
                const Text(
                  'Date of Birth',
                  style: TextStyle(
                    color: AppTheme.textSecondary,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                InkWell(
                  onTap: _pickDateOfBirth,
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                    decoration: BoxDecoration(
                      color: AppTheme.inputBackground,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppTheme.darkCardBorder),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          DateFormat('MMMM dd, yyyy').format(_selectedDob),
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                        const Icon(
                          Icons.calendar_today_rounded,
                          color: AppTheme.primaryGold,
                          size: 20,
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                const Text(
                  'Gender',
                  style: TextStyle(
                    color: AppTheme.textSecondary,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    _buildGenderChip('FEMALE', 'Female', Icons.female_rounded),
                    const SizedBox(width: 14),
                    _buildGenderChip('MALE', 'Male', Icons.male_rounded),
                  ],
                ),
                const SizedBox(height: 20),
                const Text(
                  'City / Location',
                  style: TextStyle(
                    color: AppTheme.textSecondary,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  value: _selectedCity,
                  dropdownColor: AppTheme.darkCard,
                  style: const TextStyle(color: AppTheme.textPrimary, fontSize: 15),
                  decoration: const InputDecoration(
                    prefixIcon: Icon(Icons.location_on_outlined, color: AppTheme.primaryGold),
                  ),
                  items: _cities.map((city) {
                    return DropdownMenuItem(value: city, child: Text(city));
                  }).toList(),
                  onChanged: (v) {
                    if (v != null) setState(() => _selectedCity = v);
                  },
                ),
                const SizedBox(height: 20),
                const Text(
                  'Relationship Intent',
                  style: TextStyle(
                    color: AppTheme.textSecondary,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  value: _selectedGoal,
                  dropdownColor: AppTheme.darkCard,
                  style: const TextStyle(color: AppTheme.textPrimary, fontSize: 15),
                  decoration: const InputDecoration(
                    prefixIcon: Icon(Icons.favorite_outline_rounded, color: AppTheme.accentCrimson),
                  ),
                  items: _goals.map((goal) {
                    return DropdownMenuItem(
                      value: goal['key'],
                      child: Text(goal['label']!),
                    );
                  }).toList(),
                  onChanged: (v) {
                    if (v != null) setState(() => _selectedGoal = v);
                  },
                ),
                const SizedBox(height: 20),
                AppTextField(
                  controller: _bioController,
                  label: 'About You (Bio)',
                  hint: 'Share your background, passions, and what you value...',
                  maxLines: 3,
                  prefixIcon: Icons.edit_note_rounded,
                ),
                const SizedBox(height: 36),
                AppButton(
                  text: 'Continue to Preferences',
                  isLoading: _isLoading,
                  onPressed: _handleSave,
                  icon: Icons.arrow_forward_rounded,
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildGenderChip(String key, String label, IconData icon) {
    final isSelected = _selectedGender == key;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _selectedGender = key),
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: isSelected ? AppTheme.primaryGold.withOpacity(0.15) : AppTheme.inputBackground,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isSelected ? AppTheme.primaryGold : AppTheme.darkCardBorder,
              width: isSelected ? 1.8 : 1.0,
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                color: isSelected ? AppTheme.primaryGold : AppTheme.textSecondary,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                label,
                style: TextStyle(
                  color: isSelected ? AppTheme.primaryGold : AppTheme.textSecondary,
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
