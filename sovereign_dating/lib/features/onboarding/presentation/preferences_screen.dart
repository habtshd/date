import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme.dart';
import '../../../core/widgets/app_button.dart';
import '../domain/user_profile.dart';
import '../domain/preferences.dart';
import 'controllers/onboarding_controllers.dart';

class PreferencesScreen extends ConsumerStatefulWidget {
  const PreferencesScreen({super.key});

  @override
  ConsumerState<PreferencesScreen> createState() => _PreferencesScreenState();
}

class _PreferencesScreenState extends ConsumerState<PreferencesScreen> {
  RangeValues _ageRange = const RangeValues(22, 32);
  Gender? _preferredGender = Gender.female;
  String _preferredCity = 'Addis Ababa';
  RelationshipGoal _relationshipGoal = RelationshipGoal.marriage;
  bool _initialized = false;

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

  void _populateExisting(Preferences p) {
    if (_initialized) return;
    _ageRange = RangeValues(p.minAge.toDouble(), p.maxAge.toDouble());
    _preferredGender = p.preferredGender;
    if (p.preferredCity != null && _cities.contains(p.preferredCity)) {
      _preferredCity = p.preferredCity!;
    }
    if (p.relationshipGoal != null) {
      _relationshipGoal = p.relationshipGoal!;
    }
    _initialized = true;
  }

  Future<void> _handleContinue() async {
    final prefs = Preferences(
      minAge: _ageRange.start.round(),
      maxAge: _ageRange.end.round(),
      preferredGender: _preferredGender,
      preferredCity: _preferredCity,
      relationshipGoal: _relationshipGoal,
    );

    final validationError = prefs.validate();
    if (validationError != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(validationError),
          backgroundColor: AppTheme.accentCoral,
        ),
      );
      return;
    }

    final success = await ref
        .read(preferencesControllerProvider.notifier)
        .savePreferences(prefs);

    if (mounted) {
      if (success) {
        context.push('/onboarding/interests');
      } else {
        final err = ref.read(preferencesControllerProvider).error ??
            'Could not save preferences. Try again.';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(err), backgroundColor: AppTheme.accentCoral),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(preferencesControllerProvider);
    _populateExisting(state.preferences);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dating Preferences'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildStepHeader(step: 2, totalSteps: 5, title: 'Who Are You Looking For?'),
              const SizedBox(height: 24),

              // Age Range
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Age Range',
                    style: TextStyle(
                      color: AppTheme.textSecondary,
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    '${_ageRange.start.round()} - ${_ageRange.end.round()} yrs',
                    style: const TextStyle(
                      color: AppTheme.primaryGold,
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              RangeSlider(
                values: _ageRange,
                min: 18,
                max: 65,
                divisions: 47,
                activeColor: AppTheme.primaryGold,
                inactiveColor: AppTheme.darkCardBorder,
                onChanged: (vals) {
                  setState(() => _ageRange = vals);
                },
              ),
              const SizedBox(height: 24),

              // Gender Preference
              const Text(
                'Interested in',
                style: TextStyle(
                  color: AppTheme.textSecondary,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  _buildGenderChip('Women', Gender.female),
                  const SizedBox(width: 8),
                  _buildGenderChip('Men', Gender.male),
                  const SizedBox(width: 8),
                  _buildGenderChip('Everyone', null),
                ],
              ),
              const SizedBox(height: 24),

              // Preferred City
              const Text(
                'Preferred City',
                style: TextStyle(
                  color: AppTheme.textSecondary,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                initialValue: _preferredCity,
                dropdownColor: AppTheme.darkCard,
                style: const TextStyle(color: AppTheme.textPrimary, fontSize: 15),
                decoration: const InputDecoration(
                  prefixIcon: Icon(Icons.location_city_rounded, color: AppTheme.primaryGold),
                ),
                items: _cities.map((city) {
                  return DropdownMenuItem(value: city, child: Text(city));
                }).toList(),
                onChanged: (v) {
                  if (v != null) setState(() => _preferredCity = v);
                },
              ),
              const SizedBox(height: 24),

              // Relationship Goal
              const Text(
                'What are you looking for?',
                style: TextStyle(
                  color: AppTheme.textSecondary,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 12),
              ...RelationshipGoal.values.map((goal) {
                final isSelected = _relationshipGoal == goal;
                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? AppTheme.primaryGold.withValues(alpha: 0.12)
                        : AppTheme.darkCard,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isSelected ? AppTheme.primaryGold : AppTheme.darkCardBorder,
                      width: isSelected ? 1.8 : 1.0,
                    ),
                  ),
                  child: Material(
                    color: Colors.transparent,
                    borderRadius: BorderRadius.circular(16),
                    child: RadioListTile<RelationshipGoal>(
                      value: goal,
                      groupValue: _relationshipGoal,
                      activeColor: AppTheme.primaryGold,
                      title: Text(
                        goal.displayName,
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                          color: isSelected ? AppTheme.primaryGold : AppTheme.textPrimary,
                        ),
                      ),
                      onChanged: (val) {
                        if (val != null) setState(() => _relationshipGoal = val);
                      },
                    ),
                  ),
                );
              }),
              const SizedBox(height: 32),

              AppButton(
                text: 'Continue',
                isLoading: state.isLoading,
                onPressed: _handleContinue,
                icon: Icons.arrow_forward_rounded,
              ),
              const SizedBox(height: 16),
            ],
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

  Widget _buildGenderChip(String label, Gender? gender) {
    final isSelected = _preferredGender == gender;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _preferredGender = gender),
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
              label,
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
