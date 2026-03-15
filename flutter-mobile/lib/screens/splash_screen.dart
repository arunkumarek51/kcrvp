import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../utils/constants.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});
  @override State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with TickerProviderStateMixin {
  late AnimationController _logoCtrl;
  late AnimationController _textCtrl;
  late Animation<double> _logoScale;
  late Animation<double> _logoOpacity;
  late Animation<double> _textOpacity;
  late Animation<Offset> _textSlide;

  @override
  void initState() {
    super.initState();

    _logoCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 800));
    _textCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 600));

    _logoScale   = Tween(begin: 0.5, end: 1.0).animate(CurvedAnimation(parent: _logoCtrl, curve: Curves.elasticOut));
    _logoOpacity = Tween(begin: 0.0, end: 1.0).animate(CurvedAnimation(parent: _logoCtrl, curve: const Interval(0, 0.5)));
    _textOpacity = Tween(begin: 0.0, end: 1.0).animate(_textCtrl);
    _textSlide   = Tween(begin: const Offset(0, 0.3), end: Offset.zero).animate(CurvedAnimation(parent: _textCtrl, curve: Curves.easeOut));

    _logoCtrl.forward().then((_) => _textCtrl.forward());
    _navigate();
  }

  Future<void> _navigate() async {
    await Future.delayed(const Duration(milliseconds: 2000));
    if (!mounted) return;
    final auth = context.read<AuthService>();
    // Wait for auth to finish loading
    while (auth.loading) {
      await Future.delayed(const Duration(milliseconds: 100));
      if (!mounted) return;
    }
    if (auth.isLoggedIn) {
      context.go('/dashboard');
    } else {
      context.go('/login');
    }
  }

  @override
  void dispose() {
    _logoCtrl.dispose();
    _textCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF0D3B2E), Color(0xFF1A6B3C), Color(0xFF0D4D35)],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Animated logo
                ScaleTransition(
                  scale: _logoScale,
                  child: FadeTransition(
                    opacity: _logoOpacity,
                    child: Container(
                      width: 100, height: 100,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF2D9B5A), Color(0xFF4CC97F)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(28),
                        boxShadow: [BoxShadow(color: KColors.sprout.withOpacity(0.4), blurRadius: 30, offset: const Offset(0, 10))],
                      ),
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          const Icon(Icons.park, color: Colors.white, size: 48),
                          Positioned(
                            bottom: 14, right: 14,
                            child: Container(
                              width: 20, height: 20,
                              decoration: BoxDecoration(color: KColors.gold, borderRadius: BorderRadius.circular(4)),
                              child: const Icon(Icons.bolt, color: Colors.white, size: 14),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 28),

                // Animated text
                SlideTransition(
                  position: _textSlide,
                  child: FadeTransition(
                    opacity: _textOpacity,
                    child: Column(
                      children: [
                        const Text(
                          'KCRVP',
                          style: TextStyle(fontSize: 40, fontWeight: FontWeight.w800, color: Colors.white, letterSpacing: -1),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Kerala Carbon Registry',
                          style: TextStyle(fontSize: 14, color: Colors.white.withOpacity(0.5), letterSpacing: 1, fontWeight: FontWeight.w400),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Verification Platform',
                          style: TextStyle(fontSize: 13, color: Colors.white.withOpacity(0.35), letterSpacing: 1),
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 60),

                // Loading dots
                FadeTransition(
                  opacity: _textOpacity,
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: List.generate(3, (i) => _Dot(delay: i * 200)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Dot extends StatefulWidget {
  final int delay;
  const _Dot({required this.delay});
  @override State<_Dot> createState() => _DotState();
}

class _DotState extends State<_Dot> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 800))
      ..repeat(reverse: true);
    _anim = Tween(begin: 0.3, end: 1.0).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut));
    Future.delayed(Duration(milliseconds: widget.delay), () {
      if (mounted) _ctrl.forward();
    });
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _anim,
      child: Container(
        width: 8, height: 8, margin: const EdgeInsets.symmetric(horizontal: 4),
        decoration: const BoxDecoration(color: KColors.sprout, shape: BoxShape.circle),
      ),
    );
  }
}
