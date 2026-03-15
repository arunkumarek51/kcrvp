import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';

import 'services/api_service.dart';
import 'services/auth_service.dart';
import 'screens/splash_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/register_screen.dart';
import 'screens/home/home_screen.dart';
import 'screens/activities/activities_screen.dart';
import 'screens/activities/submit_activity_screen.dart';
import 'screens/activities/activity_detail_screen.dart';
import 'screens/marketplace/marketplace_screen.dart';
import 'screens/credits/credits_screen.dart';
import 'screens/map/map_screen.dart';
import 'screens/profile/profile_screen.dart';
import 'screens/leaderboard/leaderboard_screen.dart';
import 'screens/auditor/auditor_screen.dart';
import 'screens/admin/admin_screen.dart';
import 'utils/constants.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.dark,
  ));
  await SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp, DeviceOrientation.portraitDown]);
  runApp(MultiProvider(
    providers: [
      ChangeNotifierProvider(create: (_) => AuthService()),
      Provider(create: (_) => ApiService()),
    ],
    child: const KCRVPApp(),
  ));
}

class KCRVPApp extends StatelessWidget {
  const KCRVPApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'KCRVP – Kerala Carbon Registry',
      debugShowCheckedModeBanner: false,
      theme: _buildTheme(),
      routerConfig: _buildRouter(),
    );
  }

  ThemeData _buildTheme() => ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(seedColor: KColors.canopy, primary: KColors.canopy, secondary: KColors.leaf),
    textTheme: GoogleFonts.soraTextTheme(),
    appBarTheme: AppBarTheme(
      backgroundColor: Colors.white, elevation: 0, scrolledUnderElevation: 1,
      shadowColor: KColors.forest.withOpacity(0.1),
      titleTextStyle: GoogleFonts.sora(color: KColors.forest, fontWeight: FontWeight.w700, fontSize: 18),
      iconTheme: const IconThemeData(color: KColors.canopy),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(style: ElevatedButton.styleFrom(
      backgroundColor: KColors.canopy, foregroundColor: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24), elevation: 0,
      textStyle: GoogleFonts.sora(fontWeight: FontWeight.w600, fontSize: 15),
    )),
    inputDecorationTheme: InputDecorationTheme(
      filled: true, fillColor: Colors.white,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: KColors.cloud)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: KColors.cloud)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: KColors.leaf, width: 2)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    ),
    cardTheme: CardTheme(
      elevation: 0, color: Colors.white, surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: KColors.cloud)),
    ),
  );

  GoRouter _buildRouter() => GoRouter(
    initialLocation: '/splash',
    redirect: (ctx, state) {
      final auth = ctx.read<AuthService>();
      final loggedIn = auth.isLoggedIn;
      final onAuth = state.matchedLocation == '/login' || state.matchedLocation == '/register' || state.matchedLocation == '/splash';
      if (!loggedIn && !onAuth) return '/login';
      if (loggedIn && (state.matchedLocation == '/login' || state.matchedLocation == '/register')) return '/dashboard';
      return null;
    },
    routes: [
      GoRoute(path: '/splash',    builder: (_, __) => const SplashScreen()),
      GoRoute(path: '/login',     builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register',  builder: (_, __) => const RegisterScreen()),
      ShellRoute(
        builder: (ctx, state, child) => HomeScreen(child: child),
        routes: [
          GoRoute(path: '/dashboard',          builder: (_, __) => const DashboardScreen()),
          GoRoute(path: '/activities',          builder: (_, __) => const ActivitiesScreen()),
          GoRoute(path: '/activities/submit',   builder: (_, __) => const SubmitActivityScreen()),
          GoRoute(path: '/activities/:id',      builder: (_, s) => ActivityDetailScreen(id: s.pathParameters['id']!)),
          GoRoute(path: '/marketplace',         builder: (_, __) => const MarketplaceScreen()),
          GoRoute(path: '/credits',             builder: (_, __) => const CreditsScreen()),
          GoRoute(path: '/map',                 builder: (_, __) => const MapScreen()),
          GoRoute(path: '/profile',             builder: (_, __) => const ProfileScreen()),
          GoRoute(path: '/leaderboard',         builder: (_, __) => const LeaderboardScreen()),
          GoRoute(path: '/auditor',             builder: (_, __) => const AuditorScreen()),
          GoRoute(path: '/admin',               builder: (_, __) => const AdminScreen()),
        ],
      ),
    ],
  );
}
