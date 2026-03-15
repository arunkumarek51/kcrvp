import 'package:flutter/material.dart';
import '../../utils/constants.dart';

class AdminScreen extends StatelessWidget {
  const AdminScreen({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Admin Panel')),
    body: const Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
      Icon(Icons.admin_panel_settings, size: 56, color: KColors.fog),
      SizedBox(height: 12),
      Text('Admin Panel', style: TextStyle(fontWeight: FontWeight.w700, color: KColors.forest, fontSize: 18)),
      Text('Use the web dashboard for full admin controls', style: TextStyle(color: KColors.fog, fontSize: 13)),
    ])),
  );
}

