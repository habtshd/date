import 'package:dio/dio.dart';
import '../storage/secure_storage.dart';
import '../constants/api_endpoints.dart';
import 'api_exceptions.dart';

class AuthInterceptor extends QueuedInterceptor {
  final SecureStorage _storage;
  final Dio _dio;
  final VoidCallback? _onSessionExpired;

  AuthInterceptor({
    required SecureStorage storage,
    required Dio dio,
    VoidCallback? onSessionExpired,
  })  : _storage = storage,
        _dio = dio,
        _onSessionExpired = onSessionExpired;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    // Skip authorization for public auth endpoints
    final path = options.path;
    final isPublicEndpoint = path.contains(ApiEndpoints.sendOtp) ||
        path.contains(ApiEndpoints.verifyOtp) ||
        path.contains(ApiEndpoints.refresh);

    if (!isPublicEndpoint) {
      final token = await _storage.getAccessToken();
      if (token != null && token.isNotEmpty) {
        options.headers['Authorization'] = 'Bearer $token';
      }
    }

    return handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final response = err.response;
    final statusCode = response?.statusCode;

    // Handle 401 Unauthorized for token refresh
    if (statusCode == 401) {
      final isRefreshRequest = err.requestOptions.path.contains(ApiEndpoints.refresh);

      if (!isRefreshRequest) {
        final refreshToken = await _storage.getRefreshToken();
        if (refreshToken != null && refreshToken.isNotEmpty) {
          try {
            // Create a standalone Dio instance to avoid recursive interceptor loops
            final refreshDio = Dio(
              BaseOptions(
                baseUrl: ApiEndpoints.baseUrl,
                connectTimeout: const Duration(seconds: 10),
                receiveTimeout: const Duration(seconds: 10),
                headers: {'Content-Type': 'application/json'},
              ),
            );

            final refreshResponse = await refreshDio.post(
              ApiEndpoints.refresh,
              data: {'refreshToken': refreshToken},
            );

            if (refreshResponse.statusCode == 200 && refreshResponse.data != null) {
              final data = refreshResponse.data['data'] ?? refreshResponse.data;
              final newAccessToken = data['accessToken']?.toString();
              final newRefreshToken = data['refreshToken']?.toString();

              if (newAccessToken != null) {
                await _storage.saveTokens(
                  accessToken: newAccessToken,
                  refreshToken: newRefreshToken ?? refreshToken,
                );

                // Retry original request with new token
                final options = err.requestOptions;
                options.headers['Authorization'] = 'Bearer $newAccessToken';

                final clonedRequest = await _dio.fetch(options);
                return handler.resolve(clonedRequest);
              }
            }
          } catch (_) {
            // Refresh failed or token was revoked
            await _storage.clear();
            _onSessionExpired?.call();
          }
        } else {
          await _storage.clear();
          _onSessionExpired?.call();
        }
      } else {
        // Refresh token itself was invalid/reused/revoked
        await _storage.clear();
        _onSessionExpired?.call();
      }
    }

    // Convert DioException into ApiException for higher layers
    final apiException = ApiException.fromResponse(
      statusCode,
      response?.data,
    );

    return handler.reject(
      DioException(
        requestOptions: err.requestOptions,
        response: err.response,
        type: err.type,
        error: apiException,
        message: apiException.message,
      ),
    );
  }
}

typedef VoidCallback = void Function();
