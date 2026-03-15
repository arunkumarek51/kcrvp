import 'dart:io';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

const String BASE_URL = 'http://10.0.2.2:5000/api'; // Android emulator
// Use http://localhost:5000/api for iOS simulator
// Use your server IP for physical device: http://192.168.x.x:5000/api

class ApiService {
  late final Dio _dio;

  ApiService() {
    _dio = Dio(BaseOptions(
      baseUrl: BASE_URL,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      headers: {'Content-Type': 'application/json'},
    ));

    // Auth interceptor
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString('kcrvp_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) {
        if (error.response?.statusCode == 401) {
          // Token expired - handle logout
        }
        handler.next(error);
      },
    ));
  }

  // ── Auth ───────────────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await _dio.post('/auth/login', data: {'email': email, 'password': password});
    return response.data;
  }

  Future<Map<String, dynamic>> register(Map<String, dynamic> userData) async {
    final response = await _dio.post('/auth/register', data: userData);
    return response.data;
  }

  Future<Map<String, dynamic>> getMe() async {
    final response = await _dio.get('/auth/me');
    return response.data;
  }

  // ── Activities ─────────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> getMyActivities({int page = 1}) async {
    final response = await _dio.get('/activities/my?page=$page&limit=15');
    return response.data;
  }

  Future<Map<String, dynamic>> getMapActivities({String? type}) async {
    final params = type != null ? '?type=$type' : '';
    final response = await _dio.get('/activities/map$params');
    return response.data;
  }

  Future<Map<String, dynamic>> getActivity(String id) async {
    final response = await _dio.get('/activities/$id');
    return response.data;
  }

  Future<Map<String, dynamic>> submitActivity({
    required String type,
    required String title,
    String? description,
    required double quantity,
    double? lat,
    double? lng,
    String? address,
    String? district,
    List<File>? photos,
  }) async {
    final formData = FormData.fromMap({
      'type': type,
      'title': title,
      if (description != null) 'description': description,
      'quantity': quantity.toString(),
      if (lat != null) 'lat': lat.toString(),
      if (lng != null) 'lng': lng.toString(),
      if (address != null) 'address': address,
      if (district != null) 'district': district,
    });

    if (photos != null) {
      for (final photo in photos) {
        formData.files.add(MapEntry(
          'photos',
          await MultipartFile.fromFile(photo.path, filename: photo.path.split('/').last),
        ));
      }
    }

    final response = await _dio.post('/activities', data: formData);
    return response.data;
  }

  // ── Stats ──────────────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> getUserStats() async {
    final response = await _dio.get('/stats/user/me');
    return response.data;
  }

  Future<Map<String, dynamic>> getPlatformStats() async {
    final response = await _dio.get('/stats/platform');
    return response.data;
  }

  Future<Map<String, dynamic>> getLeaderboard() async {
    final response = await _dio.get('/stats/leaderboard');
    return response.data;
  }

  // ── Credits ────────────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> getMyCredits() async {
    final response = await _dio.get('/credits/my');
    return response.data;
  }

  // ── Marketplace ────────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> getListings({int page = 1}) async {
    final response = await _dio.get('/marketplace/listings?page=$page&limit=10');
    return response.data;
  }

  Future<Map<String, dynamic>> buyCredits(String listingId) async {
    final response = await _dio.post('/marketplace/buy/$listingId');
    return response.data;
  }

  Future<Map<String, dynamic>> listCredits({
    required String creditId,
    required double amount,
    required double pricePerCredit,
    String? description,
  }) async {
    final response = await _dio.post('/marketplace/list', data: {
      'creditId': creditId,
      'creditAmount': amount,
      'pricePerCredit': pricePerCredit,
      if (description != null) 'description': description,
    });
    return response.data;
  }

  // ── Auditor ────────────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> getPendingActivities() async {
    final response = await _dio.get('/auditor/pending?limit=30');
    return response.data;
  }

  Future<Map<String, dynamic>> verifyActivity(String id, String decision, String? note) async {
    final response = await _dio.put('/auditor/verify/$id', data: {
      'decision': decision,
      if (note != null) 'note': note,
    });
    return response.data;
  }

  // ── Error handler ──────────────────────────────────────────────────────────

  String getErrorMessage(dynamic error) {
    if (error is DioException) {
      return error.response?.data?['message'] ?? error.message ?? 'Network error';
    }
    return error.toString();
  }
}
