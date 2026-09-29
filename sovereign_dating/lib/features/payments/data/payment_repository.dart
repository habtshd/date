import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants/api_endpoints.dart';

final paymentRepositoryProvider = Provider<PaymentRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return PaymentRepository(apiClient);
});

class PaymentInitResult {
  final String paymentId;
  final String? checkoutUrl;
  final double amount;
  final String currency;

  const PaymentInitResult({
    required this.paymentId,
    this.checkoutUrl,
    required this.amount,
    required this.currency,
  });

  factory PaymentInitResult.fromJson(Map<String, dynamic> json) {
    return PaymentInitResult(
      paymentId: json['paymentId']?.toString() ?? json['id']?.toString() ?? '',
      checkoutUrl: json['checkoutUrl']?.toString(),
      amount: (json['amount'] is num) ? (json['amount'] as num).toDouble() : 50.0,
      currency: json['currency']?.toString() ?? 'ETB',
    );
  }
}

class PaymentRepository {
  final ApiClient _apiClient;

  PaymentRepository(this._apiClient);

  Future<PaymentInitResult> initiatePayment({
    required String conversationId,
  }) async {
    // Client strictly provides conversationId; server calculates price and currency
    final response = await _apiClient.post(
      ApiEndpoints.conversationPayment(conversationId),
      data: {'conversationId': conversationId},
    );
    return PaymentInitResult.fromJson(response as Map<String, dynamic>);
  }

  Future<String> getPaymentStatus(String paymentId) async {
    final response = await _apiClient.get('/payments/$paymentId/status');
    if (response is Map<String, dynamic>) {
      return response['status']?.toString() ?? 'PENDING';
    }
    return 'PENDING';
  }
}
