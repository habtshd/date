import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme.dart';
import '../../../core/widgets/app_button.dart';
import '../data/profile_repository.dart';

class PreferencesSetupScreen extends ConsumerStatefulWidget {
  const PreferencesSetupScreen({super.key});

  @override
  ConsumerState<PreferencesSetupScreen> createState() => _PreferencesSetupScreenState();
}

class _PreferencesSetupScreenState extends ConsumerState<PreferencesSetupScreen> {
  String _interestedInGender = 'MALE';
  RangeValues _ageRange = const RangeValues(22, 35);
  final Set<String> _selectedInterests = {};
  bool _isLoading = false;

  final List<String> _allInterests = [
    '☕ Coffee Ceremony',
    '🏔️ Simien Hiking',
    '💻 Tech & Startups',
    '📚 Ethiopian History',
    '🎵 Ethio-Jazz & Music',
    '🍲 Traditional Cooking',
    '🏃 Long Distance Running',
    '🎨 Visual Art & Heritage',
    '✈️ World Travel',
    '📖 Literature & Poetry',
    '🏛️ Architecture',
    '🌱 Social Impact',
  ];

  Future<void> _handleSave() async {
    setState(() => _isLoading = true);

    try {
      await ref.read(profileRepositoryProvider).updatePreferences(
            minAge: _ageRange.start.round(),
            maxAge: _ageRange.end.round(),
            interestedInGender: _interestedInGender,
          );

      if (mounted) {
        context.push('/onboarding/photos');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to save preferences: $e'),
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
        title: const Text('Preferences (Step 2 of 3)'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'Match Preferences',
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Help our matching algorithm discover genuine connections aligned with your values.',
                style: TextStyle(fontSize: 13, color: AppTheme.textSecondary, height: 1.4),
              ),
              const SizedBox(height: 28),
              const Text(
                'I am interested in meeting',
                style: TextStyle(
                  color: AppTheme.textSecondary,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  _buildGenderOption('MALE', 'Men', Icons.male_rounded),
                  const SizedBox(width: 14),
                  _buildGenderOption('FEMALE', 'Women', Icons.female_rounded),
                ],
              ),
              const SizedBox(height: 28),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Preferred Age Range',
                    style: TextStyle(
                      color: AppTheme.textSecondary,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    '${_ageRange.start.round()} - ${_ageRange.end.round()} yrs',
                    style: const TextStyle(
                      color: AppTheme.primaryGold,
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
              RangeSlider(
                values: _ageRange,
                min: 18,
                max: 65,
                divisions: 47,
                activeColor: AppTheme.primaryGold,
                inactiveColor: AppTheme.darkCardBorder,
                onChanged: (values) => setState(() => _ageRange = values),
              ),
              const SizedBox(height: 24),
              const Text(
                'Passions & Interests (Select at least 3)',
                style: TextStyle(
                  color: AppTheme.textSecondary,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 10,
                children: _allInterests.map((interest) {
                  final isSelected = _selectedInterests.contains(interest);
                  return FilterChip(
                    label: Text(interest),
                    selected: isSelected,
                    onSelected: (val) {
                      setState(() {
                        if (val) {
                          _selectedInterests.add(interest);
                        } else {
                          _selectedInterests.remove(interest);
                        }
                      });
                    },
                    selectedColor: AppTheme.primaryGold.withOpacity(0.2),
                    checkmarkColor: AppTheme.primaryGold,
                    backgroundColor: AppTheme.inputBackground,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: BorderSide(
                        color: isSelected ? AppTheme.primaryGold : AppTheme.darkCardBorder,
                      ),
                    ),
                    labelStyle: TextStyle(
                      fontSize: 13,
                      fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                      color: isSelected ? AppTheme.primaryGold : AppTheme.textPrimary,
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 40),
              AppButton(
                text: 'Continue to Photos',
                isLoading: _isLoading,
                onPressed: _handleSave,
                icon: Icons.photo_library_rounded,
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildGenderOption(String key, String label, IconData icon) {
    final isSelected = _interestedInGender == key;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _interestedInGender = key),
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
