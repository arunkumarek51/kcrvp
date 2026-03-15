import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'api_service.dart';

class AuthService extends ChangeNotifier {
  Map<String, dynamic>? _user;
  String? _token;
  bool _loading = true;

  Map<String, dynamic>? get user => _user;
  String? get token => _token;
  bool get loading => _loading;
  bool get isLoggedIn => _user != null && _token != null;
  String get role => _user?['role'] ?? 'citizen';

  final ApiService _api = ApiService();

  AuthService() {
    _loadFromStorage();
  }

  Future<void> _loadFromStorage() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('kcrvp_token');
    final userJson = prefs.getString('kcrvp_user');
    if (userJson != null) {
      _user = json.decode(userJson);
    }

    if (_token != null) {
      try {
        final data = await _api.getMe();
        _user = data['user'];
        await prefs.setString('kcrvp_user', json.encode(_user));
      } catch (_) {
        await _logout();
      }
    }

    _loading = false;
    notifyListeners();
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    final data = await _api.login(email, password);
    await _saveSession(data['token'], data['user']);
    return data['user'];
  }

  Future<Map<String, dynamic>> register(Map<String, dynamic> userData) async {
    final data = await _api.register(userData);
    await _saveSession(data['token'], data['user']);
    return data['user'];
  }

  Future<void> _saveSession(String token, Map<String, dynamic> user) async {
    _token = token;
    _user = user;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('kcrvp_token', token);
    await prefs.setString('kcrvp_user', json.encode(user));
    notifyListeners();
  }

  Future<void> refreshUser() async {
    try {
      final data = await _api.getMe();
      _user = data['user'];
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('kcrvp_user', json.encode(_user));
      notifyListeners();
    } catch (_) {}
  }

  Future<void> logout() async {
    await _logout();
  }

  Future<void> _logout() async {
    _token = null;
    _user = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('kcrvp_token');
    await prefs.remove('kcrvp_user');
    notifyListeners();
  }

  // Helpers
  bool get isAuditor => role == 'auditor' && (_user?['auditorApproved'] == true);
  bool get isAdmin => role == 'admin';
  bool get isCompany => role == 'company';
  double get carbonSaved => (_user?['totalCarbonSaved'] as num?)?.toDouble() ?? 0.0;
  double get carbonCredits => (_user?['carbonCredits'] as num?)?.toDouble() ?? 0.0;
  int get sustainabilityScore => _user?['sustainabilityScore'] ?? 0;
  double get walletBalance => (_user?['walletBalance'] as num?)?.toDouble() ?? 0.0;
}
