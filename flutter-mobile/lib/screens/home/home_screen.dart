import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../services/auth_service.dart';
import '../../utils/constants.dart';

// Dashboard page embedded in shell
class HomeScreen extends StatefulWidget {
  final Widget child;
  const HomeScreen({super.key, required this.child});
  @override State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;

  static const _routes = ['/dashboard', '/activities', '/marketplace', '/map', '/profile'];

  static const _navItems = [
    NavigationDestination(icon: Icon(Icons.dashboard_outlined), selectedIcon: Icon(Icons.dashboard), label: 'Home'),
    NavigationDestination(icon: Icon(Icons.eco_outlined), selectedIcon: Icon(Icons.eco), label: 'Activities'),
    NavigationDestination(icon: Icon(Icons.store_outlined), selectedIcon: Icon(Icons.store), label: 'Market'),
    NavigationDestination(icon: Icon(Icons.map_outlined), selectedIcon: Icon(Icons.map), label: 'Map'),
    NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Profile'),
  ];

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();
    return Scaffold(
      body: widget.child,

      // FAB for activity submission
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/activities/submit'),
        backgroundColor: KColors.canopy,
        foregroundColor: Colors.white,
        elevation: 3,
        icon: const Icon(Icons.add, size: 20),
        label: const Text('Log Activity', style: TextStyle(fontWeight: FontWeight.w700)),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,

      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (i) {
          setState(() => _selectedIndex = i);
          context.go(_routes[i]);
        },
        backgroundColor: Colors.white,
        elevation: 8,
        shadowColor: KColors.forest.withOpacity(0.1),
        indicatorColor: KColors.sprout.withOpacity(0.2),
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        destinations: _navItems,
      ),
    );
  }
}

// ── Dashboard Tab ──────────────────────────────────────────────────────────

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});
  @override State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Map<String, dynamic>? _stats;
  List _activities = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final auth = context.read<AuthService>();
    // Stats would be loaded from api_service here
    await Future.delayed(const Duration(milliseconds: 500)); // simulate load
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();
    final user = auth.user;

    return Scaffold(
      backgroundColor: KColors.ivory,
      body: RefreshIndicator(
        onRefresh: _load,
        color: KColors.leaf,
        child: CustomScrollView(
          slivers: [
            // App bar with gradient
            SliverAppBar(
              expandedHeight: 200,
              pinned: true,
              backgroundColor: KColors.forest,
              flexibleSpace: FlexibleSpaceBar(
                background: Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [Color(0xFF0D3B2E), Color(0xFF1A6B3C)],
                    ),
                  ),
                  child: SafeArea(
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                Text(
                                  'Hello, ${user?['name']?.toString().split(' ').first ?? 'there'} 👋',
                                  style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w700),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Your climate impact',
                                  style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 13),
                                ),
                              ]),
                              // Notification bell
                              Stack(children: [
                                IconButton(
                                  icon: const Icon(Icons.notifications_outlined, color: Colors.white),
                                  onPressed: () {},
                                ),
                                Positioned(
                                  top: 8, right: 8,
                                  child: Container(
                                    width: 8, height: 8,
                                    decoration: const BoxDecoration(color: KColors.coral, shape: BoxShape.circle),
                                  ),
                                ),
                              ]),
                            ],
                          ),
                          const SizedBox(height: 16),
                          // Score strip
                          Row(children: [
                            _ScoreChip(label: '${(auth.carbonSaved).toStringAsFixed(1)} kg', sub: 'CO₂ Saved'),
                            const SizedBox(width: 12),
                            _ScoreChip(label: '${auth.carbonCredits.toStringAsFixed(4)}', sub: 'Credits'),
                            const SizedBox(width: 12),
                            _ScoreChip(label: '${auth.sustainabilityScore}/100', sub: 'Score', highlight: true),
                          ]),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),

            SliverToBoxAdapter(child: _loading ? _buildLoading() : _buildContent(auth)),
          ],
        ),
      ),
    );
  }

  Widget _buildLoading() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(children: [
        const SizedBox(height: 16),
        ...List.generate(4, (_) => Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Container(height: 80, decoration: BoxDecoration(color: KColors.cloud.withOpacity(0.5), borderRadius: BorderRadius.circular(14))),
        )),
      ]),
    );
  }

  Widget _buildContent(AuthService auth) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const SizedBox(height: 8),

        // Quick stats grid
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 1.5,
          children: [
            _MiniStatCard(icon: Icons.park, color: KColors.leaf, label: 'Trees Planted', value: '${auth.user?['treesPlanted'] ?? 0}'),
            _MiniStatCard(icon: Icons.wb_sunny, color: KColors.gold, label: 'Solar kWh', value: '${auth.user?['solarKwh'] ?? 0}'),
            _MiniStatCard(icon: Icons.electric_car, color: KColors.sky, label: 'EV km', value: '${auth.user?['evKmDriven'] ?? 0}'),
            _MiniStatCard(icon: Icons.agriculture, color: KColors.purple, label: 'Farm Acres', value: '${auth.user?['farmingAcres'] ?? 0}'),
          ],
        ),

        const SizedBox(height: 24),

        // Action cards
        Row(children: [
          Expanded(child: _ActionCard(icon: Icons.add_circle_outline, label: 'Log Activity', color: KColors.canopy, onTap: () => context.push('/activities/submit'))),
          const SizedBox(width: 12),
          Expanded(child: _ActionCard(icon: Icons.store_outlined, label: 'Marketplace', color: KColors.sky, onTap: () => context.push('/marketplace'))),
        ]),
        const SizedBox(height: 12),
        Row(children: [
          Expanded(child: _ActionCard(icon: Icons.credit_card_outlined, label: 'My Credits', color: KColors.gold, onTap: () => context.push('/credits'))),
          const SizedBox(width: 12),
          Expanded(child: _ActionCard(icon: Icons.leaderboard_outlined, label: 'Leaderboard', color: KColors.purple, onTap: () => context.push('/leaderboard'))),
        ]),

        const SizedBox(height: 24),

        // Auditor shortcut
        if ((auth.user?['role'] == 'auditor' && auth.user?['auditorApproved'] == true) ||
             auth.user?['role'] == 'admin')
          _AuditorBanner(),

        const SizedBox(height: 80), // FAB clearance
      ]),
    );
  }
}

class _ScoreChip extends StatelessWidget {
  final String label, sub;
  final bool highlight;
  const _ScoreChip({required this.label, required this.sub, this.highlight = false});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
    decoration: BoxDecoration(
      color: highlight ? KColors.sprout.withOpacity(0.2) : Colors.white.withOpacity(0.1),
      borderRadius: BorderRadius.circular(10),
      border: highlight ? Border.all(color: KColors.sprout.withOpacity(0.4)) : null,
    ),
    child: Column(mainAxisSize: MainAxisSize.min, children: [
      Text(label, style: TextStyle(color: highlight ? KColors.sprout : Colors.white, fontWeight: FontWeight.w800, fontSize: 14, fontFamily: 'monospace')),
      Text(sub, style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 10)),
    ]),
  );
}

class _MiniStatCard extends StatelessWidget {
  final IconData icon; final Color color; final String label, value;
  const _MiniStatCard({required this.icon, required this.color, required this.label, required this.value});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), border: Border.all(color: KColors.cloud)),
    child: Row(children: [
      Container(width: 36, height: 36, decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(9)), child: Icon(icon, color: color, size: 18)),
      const SizedBox(width: 10),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: KColors.forest, fontFamily: 'monospace')),
        Text(label, style: const TextStyle(fontSize: 10, color: KColors.fog)),
      ])),
    ]),
  );
}

class _ActionCard extends StatelessWidget {
  final IconData icon; final String label; final Color color; final VoidCallback onTap;
  const _ActionCard({required this.icon, required this.label, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onTap,
    borderRadius: BorderRadius.circular(14),
    child: Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 14),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Row(children: [
        Icon(icon, color: color, size: 22),
        const SizedBox(width: 10),
        Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 13)),
        const Spacer(),
        Icon(Icons.arrow_forward_ios, color: color.withOpacity(0.5), size: 14),
      ]),
    ),
  );
}

class _AuditorBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.only(bottom: 16),
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: KColors.sky.withOpacity(0.08),
      borderRadius: BorderRadius.circular(14),
      border: Border.all(color: KColors.sky.withOpacity(0.25)),
    ),
    child: Row(children: [
      const Icon(Icons.verified_user, color: KColors.sky, size: 22),
      const SizedBox(width: 12),
      const Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Auditor Dashboard', style: TextStyle(fontWeight: FontWeight.w700, color: KColors.charcoal, fontSize: 14)),
        Text('Review pending activities', style: TextStyle(color: KColors.fog, fontSize: 12)),
      ])),
      TextButton(
        onPressed: () => context.push('/auditor'),
        style: TextButton.styleFrom(foregroundColor: KColors.sky),
        child: const Text('Open →', style: TextStyle(fontWeight: FontWeight.w700)),
      ),
    ]),
  );
}
