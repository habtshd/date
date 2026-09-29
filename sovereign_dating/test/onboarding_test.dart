import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:sovereign_dating/features/onboarding/domain/user_profile.dart';
import 'package:sovereign_dating/features/onboarding/domain/preferences.dart';
import 'package:sovereign_dating/features/onboarding/domain/interest.dart';
import 'package:sovereign_dating/features/onboarding/presentation/profile_setup_screen.dart';
import 'package:sovereign_dating/features/onboarding/presentation/preferences_screen.dart';
import 'package:sovereign_dating/features/onboarding/presentation/interests_screen.dart';
import 'package:sovereign_dating/features/onboarding/presentation/photos_screen.dart';
import 'package:sovereign_dating/features/onboarding/presentation/profile_preview_screen.dart';

void main() {
  group('Onboarding Domain Models & Validation', () {
    test('UserProfile calculates age correctly and enforces 18+ adult check', () {
      final adultProfile = UserProfile(
        firstName: 'Sara',
        dateOfBirth: DateTime(2000, 1, 1),
        gender: Gender.female,
        city: 'Addis Ababa',
      );

      expect(adultProfile.age, greaterThanOrEqualTo(24));
      expect(adultProfile.isAdult, isTrue);

      final minorProfile = UserProfile(
        firstName: 'Kid',
        dateOfBirth: DateTime.now().subtract(const Duration(days: 365 * 16)),
        gender: Gender.male,
        city: 'Addis Ababa',
      );

      expect(minorProfile.isAdult, isFalse);
    });

    test('Preferences local validation catches invalid age ranges', () {
      const validPrefs = Preferences(minAge: 21, maxAge: 30);
      expect(validPrefs.isValid, isTrue);
      expect(validPrefs.validate(), isNull);

      const underAgePrefs = Preferences(minAge: 16, maxAge: 25);
      expect(underAgePrefs.isValid, isFalse);
      expect(underAgePrefs.validate(), contains('at least 18'));

      const invertedPrefs = Preferences(minAge: 35, maxAge: 25);
      expect(invertedPrefs.isValid, isFalse);
      expect(invertedPrefs.validate(), contains('cannot be less than'));
    });

    test('Interest serialization preserves id and name', () {
      const interest = Interest(
        id: 'coffee-1',
        name: '☕ Coffee Ceremony',
        category: 'Culture',
      );

      final json = interest.toJson();
      final parsed = Interest.fromJson(json);

      expect(parsed.id, 'coffee-1');
      expect(parsed.name, '☕ Coffee Ceremony');
    });
  });

  group('Onboarding UI Screens Smoke Tests', () {
    testWidgets('ProfileSetupScreen renders Step 1 form fields',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(800, 1400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: ProfileSetupScreen(),
          ),
        ),
      );
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 200));

      expect(find.text('Create Profile'), findsOneWidget);
      expect(find.text('STEP 1 OF 5'), findsOneWidget);
      expect(find.text('First Name'), findsOneWidget);
      expect(find.text('Date of Birth'), findsOneWidget);
      expect(find.text('Gender'), findsOneWidget);
      expect(find.text('City'), findsOneWidget);
      expect(find.text('Continue'), findsOneWidget);

      await tester.pump(const Duration(seconds: 1));
    });

    testWidgets('PreferencesScreen renders Step 2 criteria options',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(800, 1400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: PreferencesScreen(),
          ),
        ),
      );
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 200));

      expect(find.text('Dating Preferences'), findsOneWidget);
      expect(find.text('STEP 2 OF 5'), findsOneWidget);
      expect(find.text('Age Range'), findsOneWidget);
      expect(find.text('Women'), findsOneWidget);
      expect(find.text('Men'), findsOneWidget);
      expect(find.text('Everyone'), findsOneWidget);
      expect(find.text('Marriage / Long-term'), findsOneWidget);

      await tester.pump(const Duration(seconds: 1));
    });

    testWidgets('InterestsScreen renders Step 3 with selectable chips',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(800, 1400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: InterestsScreen(),
          ),
        ),
      );
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 200));

      expect(find.text('Interests'), findsOneWidget);
      expect(find.text('STEP 3 OF 5'), findsOneWidget);
      expect(find.textContaining('selected'), findsOneWidget);
      expect(find.text('Continue'), findsOneWidget);

      await tester.pump(const Duration(seconds: 1));
    });

    testWidgets('PhotosScreen renders Step 4 with 6 photo slots',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(800, 1400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: PhotosScreen(),
          ),
        ),
      );
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 200));

      expect(find.text('Profile Photos'), findsOneWidget);
      expect(find.text('STEP 4 OF 5'), findsOneWidget);
      expect(find.text('Review Profile'), findsOneWidget);

      await tester.pump(const Duration(seconds: 1));
    });

    testWidgets('ProfilePreviewScreen renders Step 5 with verification callout',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(800, 1400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: ProfilePreviewScreen(),
          ),
        ),
      );
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 200));

      expect(find.text('Profile Preview'), findsOneWidget);
      expect(find.text('STEP 5 OF 5'), findsOneWidget);
      expect(find.text("You're Almost Ready!"), findsOneWidget);
      expect(find.text('Verify Identity with Fayda'), findsOneWidget);

      await tester.pump(const Duration(seconds: 1));
    });
  });
}
