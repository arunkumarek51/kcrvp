import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../utils/constants.dart';
import '../../widgets/k_widgets.dart';

class ActivitiesScreen extends StatefulWidget {
  const ActivitiesScreen({super.key});
  @override State<ActivitiesScreen> createState() => _ActivitiesScreenState();
}

class _ActivitiesScreenState extends State<ActivitiesScreen> with SingleTickerProviderStateMixin {
  late TabController _tabs;
  List _activities = [];
  bool _loading = true;
  String _typeFilter = 'all';
  int _page = 1;
  bool _hasMore = true;
  final _scroll = ScrollController();

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
    _load();
    _scroll.addListener(() {
      if (_scroll.position.pixels >= _scroll.position.maxScrollExtent - 200 && !_loading && _hasMore) {
        _loadMore();
      }
    });
  }

  @override
  void dispose() { _tabs.dispose(); _scroll.dispose(); super.dispose(); }

  Future<void> _load() async {
    setState(() { _loading = true; _page = 1; });
    try {
      final data = await context.read<ApiService>().getMyActivities(page: 1);
      setState(() {
        _activities = data['activities'] ?? [];
        _hasMore = (_activities.length < (data['total'] ?? 0));
        _loading = false;
      });
    } catch(e) {
      setState(() => _loading = false);
    }
  }

  Future<void> _loadMore() async {
    if (_loading) return;
    setState(() => _loading = true);
    try {
      final data = await context.read<ApiService>().getMyActivities(page: ++_page);
      final more = data['activities'] as List? ?? [];
      setState(() {
        _activities.addAll(more);
        _hasMore = _activities.length < (data['total'] ?? 0);
        _loading = false;
      });
    } catch (_) { setState(() => _loading = false); }
  }

  List get _filtered => _typeFilter == 'all'
      ? _activities
      : _activities.where((a) => a['type'] == _typeFilter).toList();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: KColors.ivory,
      appBar: AppBar(
        title: const Text('My Activities'),
        actions: [
          IconButton(icon: const Icon(Icons.add), onPressed: () => context.push('/activities/submit')),
        ],
        bottom: TabBar(
          controller: _tabs,
          labelColor: KColors.canopy,
          unselectedLabelColor: KColors.fog,
          indicatorColor: KColors.leaf,
          tabs: const [Tab(text: 'My Activities'), Tab(text: 'All Kerala')],
        ),
      ),
      body: TabBarView(
        controller: _tabs,
        children: [
          _buildMyActivities(),
          _buildAllActivities(),
        ],
      ),
    );
  }

  Widget _buildMyActivities() {
    return Column(children: [
      // Type filter chips
      SizedBox(
        height: 52,
        child: ListView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          children: [
            _FilterChip(label: '🌿 All', selected: _typeFilter == 'all', onTap: () => setState(() { _typeFilter = 'all'; })),
            ...ActivityConfig.types.entries.map((e) => _FilterChip(
              label: '${e.value['emoji']} ${e.value['label']}',
              selected: _typeFilter == e.key,
              color: e.value['color'] as Color,
              onTap: () => setState(() { _typeFilter = e.key; }),
            )),
          ],
        ),
      ),

      Expanded(child: _loading && _activities.isEmpty
          ? ListView.builder(padding: const EdgeInsets.all(16), itemCount: 6, itemBuilder: (_, __) => Padding(padding: const EdgeInsets.only(bottom: 12), child: KShimmer(height: 100)))
          : _filtered.isEmpty
              ? _buildEmpty()
              : RefreshIndicator(
                  onRefresh: _load,
                  color: KColors.leaf,
                  child: ListView.builder(
                    controller: _scroll,
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                    itemCount: _filtered.length + (_hasMore ? 1 : 0),
                    itemBuilder: (ctx, i) {
                      if (i == _filtered.length) return const Padding(padding: EdgeInsets.all(16), child: Center(child: CircularProgressIndicator()));
                      return _ActivityCard(activity: _filtered[i]);
                    },
                  ),
                ),
      ),
    ]);
  }

  Widget _buildAllActivities() {
    return const Center(child: Text('Community feed coming soon', style: TextStyle(color: KColors.fog)));
  }

  Widget _buildEmpty() {
    return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
      const Icon(Icons.eco_outlined, size: 56, color: KColors.cloud),
      const SizedBox(height: 12),
      const Text('No activities yet', style: TextStyle(fontWeight: FontWeight.w700, color: KColors.charcoal, fontSize: 16)),
      const SizedBox(height: 6),
      const Text('Start logging your green actions!', style: TextStyle(color: KColors.fog)),
      const SizedBox(height: 20),
      ElevatedButton.icon(
        onPressed: () => context.push('/activities/submit'),
        icon: const Icon(Icons.add),
        label: const Text('Log Activity'),
      ),
    ]));
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final Color? color;
  final VoidCallback onTap;
  const _FilterChip({required this.label, required this.selected, this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final c = color ?? KColors.canopy;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
        decoration: BoxDecoration(
          color: selected ? c.withOpacity(0.12) : Colors.white,
          borderRadius: BorderRadius.circular(KRadius.full),
          border: Border.all(color: selected ? c : KColors.cloud, width: selected ? 1.5 : 1),
        ),
        child: Text(label, style: TextStyle(fontSize: 12, fontWeight: selected ? FontWeight.w700 : FontWeight.w400, color: selected ? c : KColors.ash)),
      ),
    );
  }
}

class _ActivityCard extends StatelessWidget {
  final Map activity;
  const _ActivityCard({required this.activity});

  @override
  Widget build(BuildContext context) {
    final type = activity['type'] as String? ?? 'tree_planting';
    final cfg = ActivityConfig.types[type] ?? ActivityConfig.types['tree_planting']!;
    final color = cfg['color'] as Color;
    final status = activity['verificationStatus'] as String? ?? 'pending';

    return GestureDetector(
      onTap: () => context.push('/activities/${activity['_id']}'),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: KColors.cloud),
        ),
        child: Column(children: [
          Padding(
            padding: const EdgeInsets.all(14),
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Container(
                width: 48, height: 48,
                decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(12)),
                child: Center(child: Text(cfg['emoji'] as String, style: const TextStyle(fontSize: 22))),
              ),
              const SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(
                  activity['title'] as String? ?? 'Activity',
                  style: const TextStyle(fontWeight: FontWeight.w700, color: KColors.charcoal, fontSize: 14),
                  maxLines: 1, overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 3),
                Text(
                  '${activity['quantity']} ${cfg['unit']} · ${_formatDate(activity['submittedAt'])}',
                  style: const TextStyle(fontSize: 12, color: KColors.fog),
                ),
              ])),
              Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                Text(
                  '${(activity['carbonSaved'] as num?)?.toStringAsFixed(1) ?? '0'} kg',
                  style: const TextStyle(fontWeight: FontWeight.w800, color: KColors.leaf, fontSize: 15, fontFamily: 'monospace'),
                ),
                const SizedBox(height: 4),
                KStatusBadge(status),
              ]),
            ]),
          ),

          // AI confidence bar
          if (activity['aiVerification']?['analyzed'] == true)
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 0, 14, 12),
              child: Row(children: [
                const Icon(Icons.smart_toy_outlined, size: 13, color: KColors.sky),
                const SizedBox(width: 5),
                const Text('AI', style: TextStyle(fontSize: 11, color: KColors.sky)),
                const SizedBox(width: 8),
                Expanded(child: ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: (activity['aiVerification']['confidence'] as num) / 100,
                    backgroundColor: KColors.cloud,
                    color: KColors.sky,
                    minHeight: 5,
                  ),
                )),
                const SizedBox(width: 8),
                Text('${activity['aiVerification']['confidence']}%', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: KColors.sky)),
              ]),
            ),
        ]),
      ),
    );
  }

  String _formatDate(dynamic d) {
    if (d == null) return '';
    try { return DateTime.parse(d.toString()).toLocal().toString().substring(0, 10); }
    catch (_) { return ''; }
  }
}
