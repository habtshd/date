import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_exceptions.dart';
import '../../../core/storage/secure_storage.dart';
import '../../../core/constants/api_endpoints.dart';
import '../domain/auth_user.dart';
import '../domain/auth_state.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final storage = ref.watch(secureStorageProvider);
  return AuthRepository(apiClient: apiClient, storage: storage);
});

final authStateProvider = NotifierProvider<AuthNotifier, AuthState>(() {
  return AuthNotifier();
});

class AuthRepository {
  final ApiClient _apiClient;
  final SecureStorage _storage;

  AuthRepository({
    required ApiClient apiClient,
    required SecureStorage storage,
  })  : _apiClient = apiClient,
        _storage = storage;

  Future<void> sendOtp(String phoneNumber) async {
    await _apiClient.post(
      ApiEndpoints.sendOtp,
      data: {'phoneNumber': phoneNumber},
    );
  }

  Future<AuthUser> verifyOtp({
    required String phoneNumber,
    required String code,
  }) async {
    final response = await _apiClient.post(
      ApiEndpoints.verifyOtp,
      data: {
        'phoneNumber': phoneNumber,
        'code': code,
      },
    );

    final data = response is Map<String, dynamic> ? response : <String, dynamic>{};
    final accessToken = data['accessToken']?.toString() ?? '';
    final refreshToken = data['refreshToken']?.toString() ?? '';

    if (accessToken.isNotEmpty) {
      await _storage.saveTokens(
        accessToken: accessToken,
        refreshToken: refreshToken,
      );
    }

    final userData = data['user'] is Map<String, dynamic>
        ? data['user'] as Map<String, dynamic>
        : data;

    return AuthUser.fromJson(userData);
  }

  Future<AuthUser?> getCurrentUser() async {
    final token = await _storage.getAccessToken();
    if (token == null || token.isEmpty) return null;

    try {
      final response = await _apiClient.get(ApiEndpoints.me);
      if (response is Map<String, dynamic>) {
        return AuthUser.fromJson(response);
      }
      return null;
    } catch (e) {
      if (e is ApiException && e.isUnauthorized) {
        await _storage.clear();
        return null;
      }
      rethrow;
    }
  }

  Future<void> logout() async {
    try {
      await _apiClient.post(ApiEndpoints.logout);
    } catch (_) {
      // Ignore network errors on logout
    } finally {
      await _storage.clear();
    }
  }
}

class AuthNotifier extends Notifier<AuthState> {
  AuthRepository get _repo => ref.read(authRepositoryProvider);

  @override
  AuthState build() {
    Future.microtask(() => checkInitialSession());
    return const AuthState();
  }

  Future<void> checkInitialSession() async {
    state = state.copyWith(status: AuthStatus.loading);
    try {
      final user = await _repo.getCurrentUser();
      if (user != null) {
        state = state.copyWith(
          status: AuthStatus.authenticated,
          user: user,
          errorMessage: null,
        );
      } else {
        state = state.copyWith(
          status: AuthStatus.unauthenticated,
          user: null,
          errorMessage: null,
        );
      }
    } catch (_) {
      state = state.copyWith(
        status: AuthStatus.unauthenticated,
        user: null,
      );
    }
  }

  Future<bool> sendOtp(String phoneNumber) async {
    state = state.copyWith(status: AuthStatus.loading, errorMessage: null);
    try {
      await _repo.sendOtp(phoneNumber);
      state = state.copyWith(status: AuthStatus.unauthenticated);
      return true;
    } on ApiException catch (e) {
      state = state.copyWith(
        status: AuthStatus.error,
        errorMessage: e.message,
      );
      return false;
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.error,
        errorMessage: 'Failed to send OTP code. Please try again.',
      );
      return false;
    }
  }

  Future<bool> verifyOtp(String phoneNumber, String code) async {
    state = state.copyWith(status: AuthStatus.loading, errorMessage: null);
    try {
      final user = await _repo.verifyOtp(phoneNumber: phoneNumber, code: code);
      state = state.copyWith(
        status: AuthStatus.authenticated,
        user: user,
        errorMessage: null,
      );
      return true;
    } on ApiException catch (e) {
      state = state.copyWith(
        status: AuthStatus.error,
        errorMessage: e.message,
      );
      return false;
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.error,
        errorMessage: 'Invalid OTP code. Please try again.',
      );
      return false;
    }
  }

  void updateUser(AuthUser updated) {
    state = state.copyWith(user: updated);
  }

  Future<void> logout() async {
    await _repo.logout();
    state = const AuthState(status: AuthStatus.unauthenticated);
  }
}
