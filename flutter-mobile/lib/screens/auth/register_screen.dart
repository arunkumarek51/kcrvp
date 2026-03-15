import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../services/auth_service.dart';
import '../../utils/constants.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});
  @override State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _nameCtrl  = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passCtrl  = TextEditingController();
  final _compCtrl  = TextEditingController();
  String _role = 'citizen';
  String? _district;
  bool _loading = false, _showPw = false;

  static const _roles = [
    {'key':'citizen', 'label':'🧑 Citizen', 'desc':'Individuals tracking eco activities'},
    {'key':'farmer',  'label':'🌾 Farmer',  'desc':'Agricultural carbon sequestration'},
    {'key':'company', 'label':'🏢 Company', 'desc':'Buy verified carbon credits'},
    {'key':'auditor', 'label':'🔍 Auditor', 'desc':'Verify green activity submissions'},
  ];

  Future<void> _register() async {
    if (_nameCtrl.text.isEmpty || _emailCtrl.text.isEmpty || _passCtrl.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Fill all required fields')));
      return;
    }
    setState(() => _loading = true);
    try {
      await context.read<AuthService>().register({
        'name': _nameCtrl.text.trim(), 'email': _emailCtrl.text.trim(), 'password': _passCtrl.text,
        'role': _role, if (_district != null) 'district': _district, if (_compCtrl.text.isNotEmpty) 'companyName': _compCtrl.text.trim(),
      });
      if (mounted) context.go('/dashboard');
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: KColors.coral));
    } finally { if (mounted) setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Create Account'), leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => context.pop())),
    body: SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Join KCRVP 🌿', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: KColors.forest)),
        const SizedBox(height: 4),
        const Text('Start your green journey today', style: TextStyle(color: KColors.fog)),
        const SizedBox(height: 24),

        // Role selector
        const Text('I am a…', style: TextStyle(fontWeight: FontWeight.w600, color: KColors.charcoal, fontSize: 14)),
        const SizedBox(height: 10),
        GridView.count(crossAxisCount: 2, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(), crossAxisSpacing: 10, mainAxisSpacing: 10, childAspectRatio: 2.8,
          children: _roles.map((r) => GestureDetector(
            onTap: () => setState(() => _role = r['key']!),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: _role == r['key'] ? KColors.canopy.withOpacity(0.1) : Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: _role == r['key'] ? KColors.canopy : KColors.cloud, width: _role == r['key'] ? 2 : 1),
              ),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
                Text(r['label']!, style: TextStyle(fontWeight: FontWeight.w700, color: _role == r['key'] ? KColors.canopy : KColors.charcoal, fontSize: 13)),
                Text(r['desc']!, style: const TextStyle(fontSize: 9, color: KColors.fog), maxLines: 1, overflow: TextOverflow.ellipsis),
              ]),
            ),
          )).toList(),
        ),

        const SizedBox(height: 20),
        TextField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Full Name *', prefixIcon: Icon(Icons.person_outline))),
        const SizedBox(height: 10),
        TextField(controller: _emailCtrl, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Email *', prefixIcon: Icon(Icons.email_outlined))),
        const SizedBox(height: 10),
        TextField(controller: _passCtrl, obscureText: !_showPw, decoration: InputDecoration(
          labelText: 'Password *', prefixIcon: const Icon(Icons.lock_outlined),
          suffixIcon: IconButton(icon: Icon(_showPw ? Icons.visibility_off : Icons.visibility), onPressed: () => setState(() => _showPw = !_showPw)),
        )),
        const SizedBox(height: 10),
        DropdownButtonFormField<String>(
          value: _district,
          decoration: const InputDecoration(labelText: 'District', prefixIcon: Icon(Icons.location_pin)),
          items: KDistricts.all.map((d) => DropdownMenuItem(value: d, child: Text(d))).toList(),
          onChanged: (v) => setState(() => _district = v),
        ),
        if (_role == 'company') ...[
          const SizedBox(height: 10),
          TextField(controller: _compCtrl, decoration: const InputDecoration(labelText: 'Company Name', prefixIcon: Icon(Icons.business))),
        ],

        const SizedBox(height: 24),
        SizedBox(width: double.infinity, child: ElevatedButton(
          onPressed: _loading ? null : _register,
          style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 15)),
          child: _loading ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Create Account 🌿', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
        )),
        const SizedBox(height: 16),
        Center(child: GestureDetector(
          onTap: () => context.pop(),
          child: const Text.rich(TextSpan(children: [
            TextSpan(text: 'Already have an account? ', style: TextStyle(color: KColors.fog)),
            TextSpan(text: 'Sign In', style: TextStyle(color: KColors.canopy, fontWeight: FontWeight.w700)),
          ])),
        )),
        const SizedBox(height: 40),
      ]),
    ),
  );
}
