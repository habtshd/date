import 'package:flutter/foundation.dart';

class ApiEndpoints {
  static String get baseUrl {
    // Allows overriding via --dart-define=API_URL=https://api.yourdomain.com
    const envUrl = String.fromEnvironment('API_URL');
    if (envUrl.isNotEmpty) return envUrl;

    if (kIsWeb) {
      return 'http://localhost:3000/api/v1';
    }

    if (defaultTargetPlatform == TargetPlatform.android) {
      // Android emulator maps 10.0.2.2 to host machine localhost
      return 'http://10.0.2.2:3000/api/v1';
    }

    return 'http://localhost:3000/api/v1';
  }

  static String get wsUrl {
    const envWs = String.fromEnvironment('WS_URL');
    if (envWs.isNotEmpty) return envWs;

    if (kIsWeb) {
      return 'ws://localhost:3000/ws/chat';
    }

    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'ws://10.0.2.2:3000/ws/chat';
    }

    return 'ws://localhost:3000/ws/chat';
  }

  // Auth endpoints
  static const String sendOtp = '/auth/send-otp';
  static const String verifyOtp = '/auth/verify-otp';
  static const String refresh = '/auth/refresh';
  static const String logout = '/auth/logout';
  static const String me = '/users/me';

  // Profile endpoints
  static const String profile = '/profile';
  static const String preferences = '/profile/preferences';
  static const String interests = '/profile/interests';
  static const String photos = '/profile/photos';
  static const String primaryPhoto = '/profile/photos/primary';
  static const String photoUploadUrl = '/profile/photos/upload-url';
  static const String photoComplete = '/profile/photos/complete';
  static const String photoPrimary = '/profile/photos';

  // Verification endpoints
  static const String startVerification = '/verification/start';
  static const String verificationStart = '/verification/start';
  static const String verificationStatus = '/verification/status';

  // Discovery endpoints
  static const String discovery = '/discovery';
  static const String previewDiscovery = '/discovery/preview';
  static const String likes = '/likes';
  static const String passes = '/passes';

  // Matches & Conversations
  static const String matches = '/matches';
  static const String conversations = '/conversations';
  static String conversation(String id) => '/conversations/$id';
  static String conversationMessages(String id) => '/conversations/$id/messages';
  static String conversationPayment(String id) => '/payments/create';

  // Safety & Settings
  static const String blocks = '/blocks';
  static String blockUser(String userId) => '/blocks/$userId';
  static const String reports = '/reports';
  static const String notifications = '/notifications';
  static const String devices = '/devices';
}
