import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../services/auth_service.dart';
import '../../utils/constants.dart';
import '../../widgets/k_widgets.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});
  @override State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _editing = false;
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _bioCtrl = TextEditingController();
  String? _district;
  bool _saving = false;

  static const _roleColors = { 'citizen': KColors.leaf, 'farmer': KColors.gold, 'auditor': KColors.sky, 'company': KColors.purple, 'admin': KColors.coral };
  static const _roleLabels = { 'citizen': 'Citizen', 'farmer': 'Farmer', 'auditor': 'Auditor', 'company': 'Company', 'admin': 'Admin' };

  void _startEdit(Map user) {
    _nameCtrl.text = user['name'] ?? '';
    _phoneCtrl.text = user['phone'] ?? '';
    _bioCtrl.text = user['bio'] ?? '';
    _district = user['district'];
    setState(() => _editing = true);
  }

  Future<void> _save() async {
    if (_nameCtrl.text.trim().isEmpty) return;
    setState(() => _saving = true);
    try {
      // Simplified: in real app, call api.updateProfile(...)
      await context.read<AuthService>().refreshUser();
      setState(() { _editing = false; _saving = false; });
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Profile updated ✅'), backgroundColor: KColors.leaf));
    } catch (_) { setState(() => _saving = false); }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();
    final user = auth.user;
    if (user == null) return const Center(child: CircularProgressIndicator());

    final role = user['role'] as String? ?? 'citizen';
    final roleColor = _roleColors[role] ?? KColors.leaf;
    final score = user['sustainabilityScore'] as int? ?? 0;

    return Scaffold(
      backgroundColor: KColors.ivory,
      body: CustomScrollView(slivers: [
        SliverAppBar(
          expandedHeight: 200,
          pinned: true,
          actions: [
            IconButton(
              icon: Icon(_editing ? Icons.close : Icons.edit_outlined),
              onPressed: () => _editing ? setState(() => _editing = false) : _startEdit(user),
            ),
            IconButton(
              icon: const Icon(Icons.logout),
              onPressed: () async { await auth.logout(); if (mounted) context.go('/login'); },
            ),
          ],
          flexibleSpace: FlexibleSpaceBar(
            background: Container(
              decoration: BoxDecoration(gradient: LinearGradient(colors: [roleColor.withOpacity(0.8), roleColor], begin: Alignment.topLeft, end: Alignment.bottomRight)),
              child: SafeArea(child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
                child: Column(mainAxisAlignment: MainAxisAlignment.end, crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [
                    Container(width: 64, height: 64, decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), border: Border.all(color: Colors.white, width: 2), borderRadius: BorderRadius.circular(18)),
                        child: Center(child: Text(user['name']?.toString().substring(0,1) ?? '?', style: const TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w800)))),
                    const SizedBox(width: 14),
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(user['name'] ?? 'User', style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800)),
                      const SizedBox(height: 3),
                      Row(children: [
                        Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3), decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(KRadius.full)),
                            child: Text(_roleLabels[role] ?? role, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12))),
                        if (role == 'auditor' && user['auditorApproved'] == true) ...[
                          const SizedBox(width: 6),
                          Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3), decoration: BoxDecoration(color: Colors.white.withOpacity(0.15), borderRadius: BorderRadius.circular(KRadius.full)),
                              child: const Text('✓ Approved', style: TextStyle(color: Colors.white, fontSize: 11))),
                        ],
                      ]),
                    ])),
                    KCarbonRing(score: score, size: 60),
                  ]),
                ]),
              )),
            ),
          ),
        ),

        SliverToBoxAdapter(child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(children: [
            // Stats grid
            GridView.count(
              crossAxisCount: 2, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 2.0,
              children: [
                _StatRow('💨', 'CO₂ Saved', '${auth.carbonSaved.toStringAsFixed(1)} kg', KColors.leaf),
                _StatRow('🪙', 'Credits', auth.carbonCredits.toStringAsFixed(4), KColors.gold),
                _StatRow('💰', 'Wallet', '₹${auth.walletBalance.toStringAsFixed(0)}', KColors.sky),
                _StatRow('🌱', 'Activities', '${user['totalActivities'] ?? 0}', KColors.purple),
              ],
            ),

            const SizedBox(height: 16),

            // Activity breakdown
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: KColors.cloud)),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('Activity Breakdown', style: TextStyle(fontWeight: FontWeight.w700, color: KColors.forest, fontSize: 14)),
                const SizedBox(height: 12),
                _BreakdownRow(Icons.park, KColors.leaf, 'Trees Planted', '${user['treesPlanted'] ?? 0}'),
                _BreakdownRow(Icons.wb_sunny, KColors.gold, 'Solar kWh Generated', '${user['solarKwh'] ?? 0}'),
                _BreakdownRow(Icons.electric_car, KColors.sky, 'EV km Driven', '${user['evKmDriven'] ?? 0}'),
                _BreakdownRow(Icons.agriculture, KColors.purple, 'Farming Acres', '${user['farmingAcres'] ?? 0}'),
              ]),
            ),

            const SizedBox(height: 16),

            // Profile info / edit
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: KColors.cloud)),
              child: _editing ? _buildEditForm() : _buildProfileInfo(user),
            ),

            const SizedBox(height: 80),
          ]),
        )),
      ]),
    );
  }

  Widget _buildProfileInfo(Map user) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    const Text('Profile Information', style: TextStyle(fontWeight: FontWeight.w700, color: KColors.forest, fontSize: 14)),
    const SizedBox(height: 12),
    if (user['email'] != null) _InfoRow(Icons.email_outlined, user['email'] as String),
    if (user['phone'] != null) _InfoRow(Icons.phone_outlined, user['phone'] as String),
    if (user['district'] != null) _InfoRow(Icons.location_pin, '${user['district']}, Kerala'),
    if (user['bio'] != null && (user['bio'] as String).isNotEmpty) _InfoRow(Icons.info_outline, user['bio'] as String),
    if (user['companyName'] != null) _InfoRow(Icons.business, user['companyName'] as String),
  ]);

  Widget _buildEditForm() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    const Text('Edit Profile', style: TextStyle(fontWeight: FontWeight.w700, color: KColors.forest, fontSize: 14)),
    const SizedBox(height: 14),
    TextField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Full Name *', prefixIcon: Icon(Icons.person_outline))),
    const SizedBox(height: 10),
    TextField(controller: _phoneCtrl, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'Phone', prefixIcon: Icon(Icons.phone_outlined))),
    const SizedBox(height: 10),
    DropdownButtonFormField<String>(
      value: _district,
      decoration: const InputDecoration(labelText: 'District', prefixIcon: Icon(Icons.location_pin)),
      items: KDistricts.all.map((d) => DropdownMenuItem(value: d, child: Text(d))).toList(),
      onChanged: (v) => setState(() => _district = v),
    ),
    const SizedBox(height: 10),
    TextField(controller: _bioCtrl, maxLines: 3, decoration: const InputDecoration(labelText: 'Bio', alignLabelWithHint: true)),
    const SizedBox(height: 16),
    Row(children: [
      Expanded(child: OutlinedButton(onPressed: () => setState(() => _editing = false), child: const Text('Cancel'))),
      const SizedBox(width: 10),
      Expanded(child: ElevatedButton(onPressed: _saving ? null : _save, child: _saving ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Save'))),
    ]),
  ]);

  Widget _InfoRow(IconData icon, String text) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 6),
    child: Row(children: [Icon(icon, size: 16, color: KColors.fog), const SizedBox(width: 10), Expanded(child: Text(text, style: const TextStyle(color: KColors.charcoal, fontSize: 13)))]),
  );

  Widget _StatRow(String emoji, String label, String value, Color color) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
    decoration: BoxDecoration(color: color.withOpacity(0.07), borderRadius: BorderRadius.circular(12), border: Border.all(color: color.withOpacity(0.2))),
    child: Row(children: [Text(emoji, style: const TextStyle(fontSize: 18)), const SizedBox(width: 8), Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(value, style: TextStyle(fontWeight: FontWeight.w800, color: color, fontSize: 14, fontFamily: 'monospace')), Text(label, style: const TextStyle(fontSize: 11, color: KColors.fog))]))]),
  );

  Widget _BreakdownRow(IconData icon, Color color, String label, String value) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 6),
    child: Row(children: [Icon(icon, size: 18, color: color), const SizedBox(width: 10), Expanded(child: Text(label, style: const TextStyle(color: KColors.ash, fontSize: 13))), Text(value, style: TextStyle(fontWeight: FontWeight.w700, color: color, fontSize: 13, fontFamily: 'monospace'))]),
  );
}
