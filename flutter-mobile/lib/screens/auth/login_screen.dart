import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../services/auth_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailCtrl = TextEditingController();
  final _passCtrl  = TextEditingController();
  bool _showPw = false, _loading = false;

  static const _demoAccounts = [
    {'label':'Admin',   'email':'admin@kcrvp.in',   'pass':'admin123',   'color':Color(0xFFE05C3A)},
    {'label':'Farmer',  'email':'farmer@kcrvp.in',  'pass':'farmer123',  'color':Color(0xFFE8A020)},
    {'label':'Citizen', 'email':'citizen@kcrvp.in', 'pass':'citizen123', 'color':Color(0xFF2D9B5A)},
    {'label':'Auditor', 'email':'auditor@kcrvp.in', 'pass':'auditor123', 'color':Color(0xFF1A7FA8)},
    {'label':'Company', 'email':'company@kcrvp.in', 'pass':'company123', 'color':Color(0xFF7B4FD4)},
  ];

  Future<void> _login([Map? demo]) async {
    final email = demo?['email'] ?? _emailCtrl.text.trim();
    final pass  = demo?['pass']  ?? _passCtrl.text.trim();
    if (email.isEmpty || pass.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Enter email and password')));
      return;
    }
    setState(() => _loading = true);
    try {
      await context.read<AuthService>().login(email, pass);
      if (mounted) context.go('/dashboard');
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: Colors.red));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 20),
              // Logo
              Row(children: [
                Container(
                  width: 52, height: 52,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [Color(0xFF1A6B3C), Color(0xFF4CC97F)], begin: Alignment.topLeft, end: Alignment.bottomRight),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Icon(Icons.park, color: Colors.white, size: 26),
                ),
                const SizedBox(width: 12),
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Text('KCRVP', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Color(0xFF0D3B2E))),
                  Text('Kerala Carbon Registry', style: TextStyle(fontSize: 11, color: Colors.grey[500], letterSpacing: 0.5)),
                ]),
              ]),
              const SizedBox(height: 36),
              const Text('Sign In', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: Color(0xFF0D3B2E))),
              const Text('Continue your green journey', style: TextStyle(color: Colors.grey, fontSize: 15)),
              const SizedBox(height: 28),

              // Email
              TextField(controller: _emailCtrl, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Email', prefixIcon: Icon(Icons.email_outlined))),
              const SizedBox(height: 14),

              // Password
              TextField(
                controller: _passCtrl, obscureText: !_showPw,
                decoration: InputDecoration(
                  labelText: 'Password', prefixIcon: const Icon(Icons.lock_outlined),
                  suffixIcon: IconButton(icon: Icon(_showPw ? Icons.visibility_off : Icons.visibility), onPressed: () => setState(() => _showPw = !_showPw)),
                ),
              ),
              const SizedBox(height: 24),

              // Login button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _loading ? null : () => _login(),
                  child: _loading ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Text('Sign In'),
                ),
              ),
              const SizedBox(height: 24),

              // Demo accounts
              Row(children: [
                const Expanded(child: Divider()),
                Padding(padding: const EdgeInsets.symmetric(horizontal: 12), child: Text('Quick Demo', style: TextStyle(fontSize: 12, color: Colors.grey[400]))),
                const Expanded(child: Divider()),
              ]),
              const SizedBox(height: 14),
              Wrap(
                spacing: 8, runSpacing: 8,
                children: _demoAccounts.map((acc) => InkWell(
                  onTap: () => _login(acc),
                  borderRadius: BorderRadius.circular(8),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      border: Border.all(color: (acc['color'] as Color).withOpacity(0.3)),
                      borderRadius: BorderRadius.circular(8),
                      color: (acc['color'] as Color).withOpacity(0.06),
                    ),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      Container(width: 8, height: 8, decoration: BoxDecoration(color: acc['color'] as Color, shape: BoxShape.circle)),
                      const SizedBox(width: 6),
                      Text(acc['label'] as String, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: acc['color'] as Color)),
                    ]),
                  ),
                )).toList(),
              ),
              const SizedBox(height: 28),
              Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                const Text("New to KCRVP? ", style: TextStyle(color: Colors.grey)),
                GestureDetector(onTap: () => context.push('/register'), child: const Text('Create Account', style: TextStyle(color: Color(0xFF1A6B3C), fontWeight: FontWeight.w700))),
              ]),
            ],
          ),
        ),
      ),
    );
  }
}
