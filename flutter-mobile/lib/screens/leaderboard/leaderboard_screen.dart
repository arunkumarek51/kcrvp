import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../utils/constants.dart';
import '../../widgets/k_widgets.dart';

class LeaderboardScreen extends StatefulWidget {
  const LeaderboardScreen({super.key});
  @override State<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends State<LeaderboardScreen> {
  List _leaders = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final data = await context.read<ApiService>().getLeaderboard();
      setState(() { _leaders = data['leaderboard'] ?? []; _loading = false; });
    } catch (_) { setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) {
    final myId = context.watch<AuthService>().user?['_id'];
    final myRank = _leaders.indexWhere((l) => l['_id'] == myId) + 1;

    return Scaffold(
      backgroundColor: KColors.ivory,
      body: CustomScrollView(slivers: [
        SliverAppBar(
          expandedHeight: myRank > 0 ? 220 : 160,
          pinned: true,
          flexibleSpace: FlexibleSpaceBar(
            background: Container(
              decoration: const BoxDecoration(gradient: LinearGradient(colors: [KColors.forest, KColors.canopy], begin: Alignment.topLeft, end: Alignment.bottomRight)),
              padding: const EdgeInsets.fromLTRB(20, 80, 20, 20),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('🏆 Green Champions', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w800)),
                const Text('Kerala\'s top carbon savers', style: TextStyle(color: Colors.white54, fontSize: 13)),
                if (myRank > 0) ...[
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(color: KColors.sprout.withOpacity(0.2), borderRadius: BorderRadius.circular(12), border: Border.all(color: KColors.sprout.withOpacity(0.3))),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      const Icon(Icons.emoji_events, color: KColors.sprout, size: 16),
                      const SizedBox(width: 6),
                      Text('Your rank: #$myRank of ${_leaders.length}', style: const TextStyle(color: KColors.sprout, fontWeight: FontWeight.w700, fontSize: 13)),
                    ]),
                  ),
                ],
              ]),
            ),
          ),
        ),

        // Podium (top 3)
        if (_leaders.length >= 3)
          SliverToBoxAdapter(child: _Podium(top3: _leaders.take(3).toList())),

        // Full list
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
          sliver: _loading
              ? SliverList(delegate: SliverChildBuilderDelegate((_, i) => Padding(padding: const EdgeInsets.only(bottom: 8), child: KShimmer(height: 62)), childCount: 8))
              : SliverList(delegate: SliverChildBuilderDelegate(
                  (ctx, i) {
                    final leader = _leaders[i];
                    final isMe = leader['_id'] == myId;
                    final medals = ['🥇','🥈','🥉'];
                    final roleColors = {'citizen': KColors.leaf, 'farmer': KColors.gold, 'auditor': KColors.sky, 'company': KColors.purple, 'admin': KColors.coral};
                    final roleColor = roleColors[leader['role']] ?? KColors.canopy;
                    return AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        color: isMe ? KColors.leaf.withOpacity(0.06) : Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: isMe ? KColors.leaf.withOpacity(0.3) : KColors.cloud),
                      ),
                      child: Row(children: [
                        SizedBox(width: 36, child: Center(child: i < 3
                            ? Text(medals[i], style: const TextStyle(fontSize: 20))
                            : Text('#${i+1}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: KColors.fog)))),
                        const SizedBox(width: 10),
                        Container(width: 36, height: 36, decoration: BoxDecoration(color: roleColor.withOpacity(0.12), borderRadius: BorderRadius.circular(10)),
                            child: Center(child: Text(leader['name']?.toString().substring(0,1) ?? '?', style: TextStyle(fontWeight: FontWeight.w800, color: roleColor, fontSize: 16)))),
                        const SizedBox(width: 10),
                        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text('${leader['name']}${isMe ? ' (You)' : ''}', style: const TextStyle(fontWeight: FontWeight.w600, color: KColors.charcoal, fontSize: 14), maxLines: 1, overflow: TextOverflow.ellipsis),
                          Text(leader['district'] ?? 'Kerala', style: const TextStyle(fontSize: 11, color: KColors.fog)),
                        ])),
                        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                          Text('${(leader['totalCarbonSaved'] as num?)?.toStringAsFixed(0) ?? 0} kg', style: const TextStyle(fontWeight: FontWeight.w800, color: KColors.leaf, fontSize: 14, fontFamily: 'monospace')),
                          Text('score: ${leader['sustainabilityScore'] ?? 0}', style: const TextStyle(fontSize: 11, color: KColors.fog)),
                        ]),
                      ]),
                    );
                  },
                  childCount: _leaders.length,
                )),
        ),
      ]),
    );
  }
}

class _Podium extends StatelessWidget {
  final List top3;
  const _Podium({required this.top3});

  @override
  Widget build(BuildContext context) {
    final order = [top3.length > 1 ? top3[1] : null, top3[0], top3.length > 2 ? top3[2] : null];
    final heights = [70.0, 100.0, 50.0];
    final medals = ['🥈', '🥇', '🥉'];

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 10),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [Color(0xFF0D3B2E), Color(0xFF1A5C35)], begin: Alignment.topLeft, end: Alignment.bottomRight),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.end, children: List.generate(3, (i) {
        final leader = order[i];
        if (leader == null) return const SizedBox(width: 90);
        return Expanded(child: Column(mainAxisSize: MainAxisSize.min, children: [
          Text(medals[i], style: const TextStyle(fontSize: 24)),
          const SizedBox(height: 4),
          Text(leader['name']?.toString().split(' ').first ?? '?', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12), maxLines: 1, overflow: TextOverflow.ellipsis, textAlign: TextAlign.center),
          Text('${(leader['totalCarbonSaved'] as num?)?.toStringAsFixed(0) ?? 0} kg', style: const TextStyle(color: Color(0xFF4CC97F), fontSize: 11, fontFamily: 'monospace')),
          const SizedBox(height: 8),
          Container(height: heights[i], width: 70, decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.1),
            borderRadius: const BorderRadius.only(topLeft: Radius.circular(10), topRight: Radius.circular(10)),
          ), child: Center(child: Text('#${i==1?1:i==0?2:3}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 18)))),
        ]));
      })),
    );
  }
}
