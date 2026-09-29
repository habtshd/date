import 'package:dio/dio.dart';

class ProfileApi {
  final Dio dio;

  ProfileApi(this.dio);

  Future<Map<String, dynamic>> getProfile() async {
    final response = await dio.get('/profile');
    final data = response.data;
    if (data is Map<String, dynamic>) {
      return data.containsKey('data') ? data['data'] as Map<String, dynamic> : data;
    }
    return {};
  }

  Future<Map<String, dynamic>> createProfile(Map<String, dynamic> data) async {
    final response = await dio.post('/profile', data: data);
    final resData = response.data;
    if (resData is Map<String, dynamic>) {
      return resData.containsKey('data') ? resData['data'] as Map<String, dynamic> : resData;
    }
    return {};
  }

  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> data) async {
    final response = await dio.patch('/profile', data: data);
    final resData = response.data;
    if (resData is Map<String, dynamic>) {
      return resData.containsKey('data') ? resData['data'] as Map<String, dynamic> : resData;
    }
    return {};
  }

  Future<Map<String, dynamic>> getPreferences() async {
    final response = await dio.get('/profile/preferences');
    final data = response.data;
    if (data is Map<String, dynamic>) {
      return data.containsKey('data') ? data['data'] as Map<String, dynamic> : data;
    }
    return {};
  }

  Future<Map<String, dynamic>> updatePreferences(Map<String, dynamic> data) async {
    final response = await dio.put('/profile/preferences', data: data);
    final resData = response.data;
    if (resData is Map<String, dynamic>) {
      return resData.containsKey('data') ? resData['data'] as Map<String, dynamic> : resData;
    }
    return {};
  }

  Future<List<dynamic>> getInterests() async {
    final response = await dio.get('/profile/interests');
    final data = response.data;
    if (data is Map<String, dynamic> && data.containsKey('data')) {
      final list = data['data'];
      return list is List ? list : [];
    }
    if (data is Map<String, dynamic> && data.containsKey('interests')) {
      final list = data['interests'];
      return list is List ? list : [];
    }
    return data is List ? data : [];
  }

  Future<void> setInterests(List<String> interestIds) async {
    await dio.post(
      '/profile/interests',
      data: {'interestIds': interestIds},
    );
  }

  Future<Map<String, dynamic>> requestPhotoUploadUrl(String contentType) async {
    final response = await dio.post(
      '/profile/photos/upload-url',
      data: {'mimeType': contentType},
    );
    final data = response.data;
    if (data is Map<String, dynamic>) {
      return data.containsKey('data') ? data['data'] as Map<String, dynamic> : data;
    }
    return {};
  }

  Future<void> uploadDirectToStorage(
    String uploadUrl,
    List<int> bytes,
    String contentType,
  ) async {
    // Direct PUT to object storage / presigned URL using standalone Dio without app interceptors
    final directDio = Dio();
    await directDio.put(
      uploadUrl,
      data: Stream.fromIterable([bytes]),
      options: Options(
        headers: {
          'Content-Type': contentType,
          'Content-Length': bytes.length,
        },
      ),
    );
  }

  Future<Map<String, dynamic>> completePhotoUpload(
    String storageKey, {
    bool isPrimary = false,
  }) async {
    final response = await dio.post(
      '/profile/photos/complete',
      data: {
        'storageKey': storageKey,
        'isPrimary': isPrimary,
      },
    );
    final data = response.data;
    if (data is Map<String, dynamic>) {
      return data.containsKey('data') ? data['data'] as Map<String, dynamic> : data;
    }
    return {};
  }

  Future<void> setPrimaryPhoto(String photoId) async {
    await dio.patch('/profile/photos/$photoId/primary');
  }

  Future<void> deletePhoto(String photoId) async {
    await dio.delete('/profile/photos/$photoId');
  }
}
