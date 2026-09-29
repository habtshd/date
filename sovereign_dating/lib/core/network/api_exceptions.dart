class ApiException implements Exception {
  final String code;
  final String message;
  final int? statusCode;
  final dynamic details;

  ApiException({
    required this.code,
    required this.message,
    this.statusCode,
    this.details,
  });

  factory ApiException.fromResponse(int? statusCode, dynamic data) {
    if (data is Map<String, dynamic>) {
      // Check standard backend error format: { error: { code, message } }
      if (data.containsKey('error') && data['error'] is Map<String, dynamic>) {
        final err = data['error'] as Map<String, dynamic>;
        return ApiException(
          code: err['code']?.toString() ?? 'UNKNOWN_ERROR',
          message: err['message']?.toString() ?? 'An unexpected error occurred.',
          statusCode: statusCode,
          details: err['details'],
        );
      }
      // Check flat format: { code, message }
      if (data.containsKey('message')) {
        return ApiException(
          code: data['code']?.toString() ?? 'API_ERROR',
          message: data['message']?.toString() ?? 'An error occurred.',
          statusCode: statusCode,
          details: data['details'],
        );
      }
    }

    return ApiException(
      code: _getDefaultCodeForStatus(statusCode),
      message: _getDefaultMessageForStatus(statusCode),
      statusCode: statusCode,
    );
  }

  static String _getDefaultCodeForStatus(int? status) {
    switch (status) {
      case 400:
        return 'VALIDATION_ERROR';
      case 401:
        return 'UNAUTHORIZED';
      case 402:
        return 'PAYMENT_REQUIRED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT';
      case 429:
        return 'RATE_LIMITED';
      case 500:
        return 'INTERNAL_SERVER_ERROR';
      default:
        return 'NETWORK_ERROR';
    }
  }

  static String _getDefaultMessageForStatus(int? status) {
    switch (status) {
      case 401:
        return 'Session expired. Please log in again.';
      case 402:
        return 'Payment is required to perform this action.';
      case 403:
        return 'Access denied. Verification or permission required.';
      case 404:
        return 'Requested resource was not found.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
      case 502:
      case 503:
        return 'Server is temporarily unavailable. Please try again later.';
      default:
        return 'Connection problem. Please check your network and retry.';
    }
  }

  bool get isVerificationRequired => code == 'VERIFICATION_REQUIRED';
  bool get isConversationLocked => code == 'CONVERSATION_LOCKED';
  bool get isPaymentRequired => code == 'PAYMENT_REQUIRED';
  bool get isRateLimited => code == 'RATE_LIMITED';
  bool get isUnauthorized => code == 'UNAUTHORIZED' || statusCode == 401;

  @override
  String toString() => 'ApiException [$code] ($statusCode): $message';
}
