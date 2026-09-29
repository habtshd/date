import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../app/theme.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';
import '../domain/user_profile.dart';
import 'controllers/onboarding_controllers.dart';

class ProfileSetupScreen extends ConsumerStatefulWidget {
  const ProfileSetupScreen({super.key});

  @override
  ConsumerState<ProfileSetupScreen> createState() => _ProfileSetupScreenState();
}

class _ProfileSetupScreenState extends ConsumerState<ProfileSetupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameController = TextEditingController();
  final _bioController = TextEditingController();

  DateTime _selectedDob = DateTime(
    DateTime.now().year - 24,
    DateTime.now().month,
    DateTime.now().day,
  );
  Gender _selectedGender = Gender.female;
  String _selectedCity = 'Addis Ababa';
  bool _initializedFromState = false;

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

  @override
  void dispose() {
    _firstNameController.dispose();
    _bioController.dispose();
    super.dispose();
  }

  void _populateExisting(UserProfile profile) {
    if (_initializedFromState) return;
    _firstNameController.text = profile.firstName;
    _bioController.text = profile.bio ?? '';
    _selectedDob = profile.dateOfBirth;
    _selectedGender = profile.gender;
    if (_cities.contains(profile.city)) {
      _selectedCity = profile.city;
    }
    _initializedFromState = true;
  }

  Future<void> _pickDateOfBirth() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDob,
      firstDate: DateTime(1900),
      lastDate: now,
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

  Future<void> _handleContinue() async {
    if (!_formKey.currentState!.validate()) return;

    // Check adult validation (18+)
    final now = DateTime.now();
    int age = now.year - _selectedDob.year;
    if (now.month < _selectedDob.month ||
        (now.month == _selectedDob.month && now.day < _selectedDob.day)) {
      age--;
    }

    if (age < 18) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('You must be at least 18 years old to join.'),
          backgroundColor: AppTheme.accentCoral,
        ),
      );
      return;
    }

    final profile = UserProfile(
      firstName: _firstNameController.text.trim(),
      dateOfBirth: _selectedDob,
      gender: _selectedGender,
      city: _selectedCity,
      bio: _bioController.text.trim().isNotEmpty ? _bioController.text.trim() : null,
    );

    final success = await ref
        .read(profileControllerProvider.notifier)
        .saveProfile(profile);

    if (mounted) {
      if (success) {
        context.push('/onboarding/preferences');
      } else {
        final err = ref.read(profileControllerProvider).error ??
            'Could not save your profile. Try again.';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(err), backgroundColor: AppTheme.accentCoral),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final profileState = ref.watch(profileControllerProvider);
    if (profileState.profile != null) {
      _populateExisting(profileState.profile!);
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Create Profile'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Step Progress Header
                _buildStepHeader(step: 1, totalSteps: 5, title: 'Basic Information'),
                const SizedBox(height: 24),

                AppTextField(
                  controller: _firstNameController,
                  label: 'First Name',
                  hint: 'Sara',
                  prefixIcon: Icons.person_outline_rounded,
                  validator: (val) {
                    if (val == null || val.trim().isEmpty) {
                      return 'Please enter your first name';
                    }
                    if (val.trim().length < 2) {
                      return 'Must be at least 2 characters';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 20),

                // Date of Birth
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
                    padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
                    decoration: BoxDecoration(
                      color: AppTheme.inputBackground,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppTheme.darkCardBorder),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          DateFormat('dd / MM / yyyy').format(_selectedDob),
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

                // Gender
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
                    _buildGenderRadio(Gender.female),
                    const SizedBox(width: 8),
                    _buildGenderRadio(Gender.male),
                    const SizedBox(width: 8),
                    _buildGenderRadio(Gender.other),
                  ],
                ),
                const SizedBox(height: 20),

                // City
                const Text(
                  'City',
                  style: TextStyle(
                    color: AppTheme.textSecondary,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  initialValue: _selectedCity,
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

                // Bio
                AppTextField(
                  controller: _bioController,
                  label: 'Bio',
                  hint: 'Tell people about yourself, your background and passions...',
                  maxLines: 3,
                  prefixIcon: Icons.edit_note_rounded,
                ),
                const SizedBox(height: 36),

                AppButton(
                  text: 'Continue',
                  isLoading: profileState.isLoading,
                  onPressed: _handleContinue,
                  icon: Icons.arrow_forward_rounded,
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStepHeader({
    required int step,
    required int totalSteps,
    required String title,
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
      ],
    );
  }

  Widget _buildGenderRadio(Gender gender) {
    final isSelected = _selectedGender == gender;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _selectedGender = gender),
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected
                ? AppTheme.primaryGold.withValues(alpha: 0.15)
                : AppTheme.inputBackground,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isSelected ? AppTheme.primaryGold : AppTheme.darkCardBorder,
              width: isSelected ? 1.8 : 1.0,
            ),
          ),
          child: Center(
            child: Text(
              gender.displayName,
              style: TextStyle(
                color: isSelected ? AppTheme.primaryGold : AppTheme.textSecondary,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                fontSize: 13,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
