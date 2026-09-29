import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'profile_setup_screen.dart';
import 'preferences_screen.dart';
import 'interests_screen.dart';
import 'photos_screen.dart';
import 'profile_preview_screen.dart';
import 'controllers/onboarding_controllers.dart';

class OnboardingRouter {
  static List<GoRoute> get routes => [
        GoRoute(
          path: '/onboarding/profile',
          builder: (context, state) => const ProfileSetupScreen(),
        ),
        GoRoute(
          path: '/onboarding/preferences',
          builder: (context, state) => const PreferencesScreen(),
        ),
        GoRoute(
          path: '/onboarding/interests',
          builder: (context, state) => const InterestsScreen(),
        ),
        GoRoute(
          path: '/onboarding/photos',
          builder: (context, state) => const PhotosScreen(),
        ),
        GoRoute(
          path: '/onboarding/preview',
          builder: (context, state) => const ProfilePreviewScreen(),
        ),
      ];

  static Future<String> resolveResumeRoute(WidgetRef ref) async {
    final progress =
        await ref.read(onboardingControllerProvider.notifier).checkProgress();
    return progress.nextRoute;
  }
}
