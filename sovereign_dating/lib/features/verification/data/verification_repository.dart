import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants/api_endpoints.dart';

final verificationRepositoryProvider = Provider<VerificationRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return VerificationRepository(apiClient);
});

class VerificationResult {
  final String status; // PENDING, VERIFIED, FAILED, EXPIRED
  final String? providerReference;
  final String? verificationUrl;
  final DateTime? verifiedAt;

  const VerificationResult({
    required this.status,
    this.providerReference,
    this.verificationUrl,
    this.verifiedAt,
  });

  bool get isVerified => status == 'VERIFIED';
  bool get isPending => status == 'PENDING';
  bool get isFailed => status == 'FAILED';

  factory VerificationResult.fromJson(Map<String, dynamic> json) {
    return VerificationResult(
      status: json['status']?.toString() ?? 'UNVERIFIED',
      providerReference: json['providerReference']?.toString(),
      verificationUrl: json['verificationUrl']?.toString(),
      verifiedAt: json['verifiedAt'] != null
          ? DateTime.tryParse(json['verifiedAt'].toString())
          : null,
    );
  }
}

class VerificationRepository {
  final ApiClient _apiClient;

  VerificationRepository(this._apiClient);

  Future<VerificationResult> startVerification({String provider = 'FAYDA'}) async {
    final response = await _apiClient.post(
      ApiEndpoints.startVerification,
      data: {'provider': provider},
    );
    return VerificationResult.fromJson(response as Map<String, dynamic>);
  }

  Future<VerificationResult> checkStatus() async {
    final response = await _apiClient.get(ApiEndpoints.verificationStatus);
    return VerificationResult.fromJson(response as Map<String, dynamic>);
  }
}
