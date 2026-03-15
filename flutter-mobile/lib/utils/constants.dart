import 'package:flutter/material.dart';

class KColors {
  static const forest   = Color(0xFF0D3B2E);
  static const canopy   = Color(0xFF1A6B3C);
  static const leaf     = Color(0xFF2D9B5A);
  static const sprout   = Color(0xFF4CC97F);
  static const mist     = Color(0xFFA8F0C6);
  static const ivory    = Color(0xFFF5F9F6);
  static const gold     = Color(0xFFE8A020);
  static const amber    = Color(0xFFF5C842);
  static const sky      = Color(0xFF1A7FA8);
  static const coral    = Color(0xFFE05C3A);
  static const purple   = Color(0xFF7B4FD4);
  static const ink      = Color(0xFF0F1F17);
  static const charcoal = Color(0xFF1E2D24);
  static const ash      = Color(0xFF4A5E53);
  static const fog      = Color(0xFF8FA89A);
  static const cloud    = Color(0xFFD4E0D8);
  static const snow     = Colors.white;
}

class KRadius {
  static const sm = 6.0;
  static const md = 12.0;
  static const lg = 16.0;
  static const xl = 20.0;
  static const full = 999.0;
}

class ActivityConfig {
  static const Map<String, Map<String, dynamic>> types = {
    'tree_planting': {
      'label': 'Tree Planting',
      'icon': Icons.park,
      'emoji': '🌳',
      'color': Color(0xFF2D9B5A),
      'bg': Color(0x122D9B5A),
      'unit': 'trees',
      'rate': 22.0,
      'rateLabel': '22 kg CO₂/tree/yr',
    },
    'solar_energy': {
      'label': 'Solar Energy',
      'icon': Icons.wb_sunny,
      'emoji': '☀️',
      'color': Color(0xFFE8A020),
      'bg': Color(0x12E8A020),
      'unit': 'kWh',
      'rate': 0.85,
      'rateLabel': '0.85 kg CO₂/kWh',
    },
    'ev_driving': {
      'label': 'EV Driving',
      'icon': Icons.electric_car,
      'emoji': '🚗',
      'color': Color(0xFF1A7FA8),
      'bg': Color(0x121A7FA8),
      'unit': 'km',
      'rate': 0.12,
      'rateLabel': '0.12 kg CO₂/km',
    },
    'organic_farming': {
      'label': 'Organic Farming',
      'icon': Icons.agriculture,
      'emoji': '🌾',
      'color': Color(0xFF7B4FD4),
      'bg': Color(0x127B4FD4),
      'unit': 'acres',
      'rate': 200.0,
      'rateLabel': '200 kg CO₂/acre/yr',
    },
  };

  static const Map<String, Map<String, dynamic>> statuses = {
    'pending':          { 'label': 'Pending',     'color': Color(0xFFB87F10) },
    'ai_verified':      { 'label': 'AI Checked',  'color': Color(0xFF1A7FA8) },
    'auditor_verified': { 'label': 'Verified',    'color': Color(0xFF2D9B5A) },
    'approved':         { 'label': 'Approved',    'color': Color(0xFF2D9B5A) },
    'rejected':         { 'label': 'Rejected',    'color': Color(0xFFE05C3A) },
  };

  static double calculateCarbon(String type, double quantity) {
    final rate = (types[type]?['rate'] as double?) ?? 0.0;
    return quantity * rate;
  }

  static double carbonToCredits(double carbonKg) => carbonKg / 1000.0;
}

class KDistricts {
  static const List<String> all = [
    'Thiruvananthapuram', 'Kollam', 'Pathanamthitta', 'Alappuzha',
    'Kottayam', 'Idukki', 'Ernakulam', 'Thrissur', 'Palakkad',
    'Malappuram', 'Kozhikode', 'Wayanad', 'Kannur', 'Kasaragod',
  ];
}
