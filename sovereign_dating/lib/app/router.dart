import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/splash/presentation/splash_screen.dart';
import '../features/auth/presentation/welcome_screen.dart';
import '../features/auth/presentation/register_screen.dart';
import '../features/auth/presentation/otp_screen.dart';
import '../features/onboarding/presentation/onboarding_router.dart';
import '../features/profile/presentation/profile_screen.dart';
import '../features/verification/presentation/verification_prompt_screen.dart';
import '../features/verification/presentation/verification_status_screen.dart';
import '../features/discovery/presentation/discovery_screen.dart';
import '../features/matches/presentation/matches_screen.dart';
import '../features/chat/presentation/chats_screen.dart';
import '../features/chat/presentation/chat_screen.dart';
import '../features/payments/presentation/payment_screen.dart';
import '../features/payments/data/payment_repository.dart';
import '../features/settings/presentation/settings_screen.dart';
import '../shared/widgets/main_navigation_shell.dart';
final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/splash',
    routes: [
      // Splash
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),

      // Auth Public Routes
      GoRoute(
        path: '/auth/welcome',
        builder: (context, state) => const WelcomeScreen(),
      ),
      GoRoute(
        path: '/auth/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/auth/otp',
        builder: (context, state) {
          final phone = state.extra as String? ?? '';
          return OtpScreen(phoneNumber: phone);
        },
      ),

      // Onboarding 5-Step Flow Routes
      ...OnboardingRouter.routes,

      // Verification Routes
      GoRoute(
        path: '/verification/prompt',
        builder: (context, state) => const VerificationPromptScreen(),
      ),
      GoRoute(
        path: '/verification/status',
        builder: (context, state) => const VerificationStatusScreen(),
      ),

      // Payment Checkout Route
      GoRoute(
        path: '/payments/checkout',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>? ?? {};
          final conversationId = extra['conversationId']?.toString() ?? '';
          final paymentResult = extra['paymentResult'] as PaymentInitResult? ??
              const PaymentInitResult(
                paymentId: '',
                amount: 50.0,
                currency: 'ETB',
              );
          final userName = extra['userName']?.toString() ?? 'Match';

          return PaymentScreen(
            conversationId: conversationId,
            paymentResult: paymentResult,
            userName: userName,
          );
        },
      ),

      // Main Authenticated Bottom Navigation Shell
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return MainNavigationShell(navigationShell: navigationShell);
        },
        branches: [
          // Tab 0: Discover
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/app/discover',
                builder: (context, state) => const DiscoveryScreen(),
              ),
            ],
          ),

          // Tab 1: Matches
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/app/matches',
                builder: (context, state) => const MatchesScreen(),
              ),
            ],
          ),

          // Tab 2: Chats
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/app/chats',
                builder: (context, state) => const ChatsScreen(),
                routes: [
                  GoRoute(
                    path: ':conversationId',
                    builder: (context, state) {
                      final conversationId =
                          state.pathParameters['conversationId'] ?? '';
                      return ChatScreen(conversationId: conversationId);
                    },
                  ),
                ],
              ),
            ],
          ),

          // Tab 3: Profile & Settings
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/app/profile',
                builder: (context, state) => const ProfileScreen(),
              ),
            ],
          ),
        ],
      ),

      // App Settings Route
      GoRoute(
        path: '/app/settings',
        builder: (context, state) => const SettingsScreen(),
      ),
    ],
  );
});
