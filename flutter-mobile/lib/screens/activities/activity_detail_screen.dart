import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../utils/constants.dart';
import '../../widgets/k_widgets.dart';

class ActivityDetailScreen extends StatefulWidget {
  final String id;
  const ActivityDetailScreen({super.key, required this.id});
  @override State<ActivityDetailScreen> createState() => _ActivityDetailScreenState();
}

class _ActivityDetailScreenState extends State<ActivityDetailScreen> {
  Map? _activity;
  bool _loading = true, _recording = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await context.read<ApiService>().getActivity(widget.id);
      setState(() { _activity = data['activity']; _loading = false; });
    } catch(e) {
      if (mounted) { context.pop(); }
    }
  }

  Color get _typeColor => (ActivityConfig.types[_activity?['type']]?['color'] as Color?) ?? KColors.leaf;
  String get _typeEmoji => (ActivityConfig.types[_activity?['type']]?['emoji'] as String?) ?? '🌿';

  String get _statusLabel {
    final s = _activity?['verificationStatus'] as String? ?? 'pending';
    return ActivityConfig.statuses[s]?['label'] as String? ?? s;
  }
  Color get _statusColor => ActivityConfig.statuses[_activity?['verificationStatus']]?['color'] as Color? ?? KColors.fog;

  @override
  Widget build(BuildContext context) {
    if (_loading) return Scaffold(
      appBar: AppBar(title: const Text('Activity Detail')),
      body: ListView(padding: const EdgeInsets.all(16), children: List.generate(5, (_) => Padding(padding: const EdgeInsets.only(bottom: 12), child: KShimmer(height: 80)))),
    );

    final a = _activity!;
    final ai = a['aiVerification'] as Map? ?? {};

    return Scaffold(
      backgroundColor: KColors.ivory,
      body: CustomScrollView(slivers: [
        // Hero header
        SliverAppBar(
          expandedHeight: 140,
          pinned: true,
          leading: IconButton(onPressed: () => context.pop(), icon: const Icon(Icons.arrow_back, color: Colors.white)),
          flexibleSpace: FlexibleSpaceBar(
            background: Container(
              decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [_typeColor.withOpacity(0.9), _typeColor])),
              padding: const EdgeInsets.fromLTRB(20, 80, 20, 20),
              child: Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
                Text(_typeEmoji, style: const TextStyle(fontSize: 36)),
                const SizedBox(width: 14),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
                  Text(a['title'] as String? ?? 'Activity', style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w800), maxLines: 2, overflow: TextOverflow.ellipsis),
                  Text(ActivityConfig.types[a['type']]?['label'] as String? ?? '', style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 13)),
                ])),
                Column(crossAxisAlignment: CrossAxisAlignment.end, mainAxisSize: MainAxisSize.min, children: [
                  Text('${(a['carbonSaved'] as num?)?.toStringAsFixed(1) ?? 0}', style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w900, fontFamily: 'monospace')),
                  Text('kg CO₂', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 12)),
                ]),
              ]),
            ),
          ),
        ),

        SliverToBoxAdapter(child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

            // Status + stats row
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: KColors.cloud)),
              child: Column(children: [
                Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: [
                  _Stat('${a['quantity']}', '${ActivityConfig.types[a['type']]?['unit']}'),
                  _divider(),
                  _Stat('${(a['carbonCreditsEarned'] as num?)?.toStringAsFixed(4) ?? 0}', 'Credits'),
                  _divider(),
                  _Stat(ai['analyzed'] == true ? '${ai['confidence']}%' : 'N/A', 'AI Score'),
                ]),
                const SizedBox(height: 14),
                Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(color: _statusColor.withOpacity(0.1), borderRadius: BorderRadius.circular(KRadius.full)),
                    child: Text(_statusLabel, style: TextStyle(fontWeight: FontWeight.w700, color: _statusColor, fontSize: 13)),
                  ),
                  if (a['isFlagged'] == true) ...[
                    const SizedBox(width: 8),
                    Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6), decoration: BoxDecoration(color: KColors.gold.withOpacity(0.1), borderRadius: BorderRadius.circular(KRadius.full)), child: const Text('⚠️ Flagged', style: TextStyle(fontWeight: FontWeight.w700, color: KColors.gold, fontSize: 12))),
                  ],
                ]),
              ]),
            ),

            const SizedBox(height: 16),

            // Submitter
            _Card(child: KInfoTile(
              icon: Icons.person_outline,
              iconColor: KColors.canopy,
              title: a['user']?['name'] as String? ?? 'Unknown',
              subtitle: '${a['user']?['role'] ?? ''} · ${a['user']?['district'] ?? 'Kerala'}',
            )),

            if (a['description'] != null && (a['description'] as String).isNotEmpty) ...[
              const SizedBox(height: 12),
              _Card(child: Padding(padding: const EdgeInsets.all(4), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('Description', style: TextStyle(fontWeight: FontWeight.w600, color: KColors.fog, fontSize: 12)),
                const SizedBox(height: 6),
                Text(a['description'] as String, style: const TextStyle(color: KColors.charcoal, height: 1.5)),
              ]))),
            ],

            // Photos
            if ((a['photos'] as List?)?.isNotEmpty == true) ...[
              const SizedBox(height: 16),
              const Text('Photo Evidence', style: TextStyle(fontWeight: FontWeight.w700, color: KColors.forest, fontSize: 15)),
              const SizedBox(height: 10),
              SizedBox(
                height: 130,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: (a['photos'] as List).length,
                  itemBuilder: (ctx, i) {
                    final url = (a['photos'] as List)[i]['url'] as String?;
                    return Container(
                      width: 180, height: 130, margin: const EdgeInsets.only(right: 10),
                      decoration: BoxDecoration(borderRadius: BorderRadius.circular(12), color: KColors.cloud),
                      clipBehavior: Clip.antiAlias,
                      child: url != null ? Image.network(url, fit: BoxFit.cover) : const Icon(Icons.image, color: KColors.fog),
                    );
                  },
                ),
              ),
            ],

            // AI Verification
            const SizedBox(height: 16),
            _Card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                const Icon(Icons.smart_toy_outlined, color: KColors.sky, size: 18),
                const SizedBox(width: 8),
                const Text('AI Verification', style: TextStyle(fontWeight: FontWeight.w700, color: KColors.forest, fontSize: 14)),
              ]),
              const SizedBox(height: 12),
              if (ai['analyzed'] == true) ...[
                Row(children: [
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                      const Text('Confidence', style: TextStyle(color: KColors.fog, fontSize: 12)),
                      Text('${ai['confidence']}%', style: const TextStyle(fontWeight: FontWeight.w700, color: KColors.sky)),
                    ]),
                    const SizedBox(height: 6),
                    ClipRRect(borderRadius: BorderRadius.circular(4), child: LinearProgressIndicator(value: (ai['confidence'] as num) / 100, backgroundColor: KColors.cloud, color: KColors.sky, minHeight: 7)),
                  ])),
                  const SizedBox(width: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(color: ai['verificationStatus'] == 'passed' ? KColors.leaf.withOpacity(0.1) : KColors.gold.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                    child: Text(ai['verificationStatus'] == 'passed' ? '✅ Passed' : '⚠️ Review', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: ai['verificationStatus'] == 'passed' ? KColors.leaf : KColors.gold)),
                  ),
                ]),
                if ((ai['analysisDetails'] as String?)?.isNotEmpty == true) ...[
                  const SizedBox(height: 8),
                  Text(ai['analysisDetails'] as String, style: const TextStyle(fontSize: 12, color: KColors.fog, height: 1.4)),
                ],
                if ((ai['detectedObjects'] as List?)?.isNotEmpty == true) ...[
                  const SizedBox(height: 8),
                  Wrap(spacing: 6, runSpacing: 6, children: (ai['detectedObjects'] as List).map((o) => Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3), decoration: BoxDecoration(color: KColors.ivory, borderRadius: BorderRadius.circular(6)), child: Text(o.toString(), style: const TextStyle(fontSize: 11, color: KColors.ash)))).toList()),
                ],
              ] else
                const Text('Pending AI analysis', style: TextStyle(color: KColors.fog, fontSize: 13)),
            ])),

            // GPS
            if (a['location']?['coordinates'] != null) ...[
              const SizedBox(height: 12),
              _Card(child: KInfoTile(
                icon: Icons.location_pin,
                iconColor: KColors.coral,
                title: 'GPS Verified Location',
                subtitle: '${(a['location']['coordinates'][1] as num).toStringAsFixed(5)}, ${(a['location']['coordinates'][0] as num).toStringAsFixed(5)}${a['location']['district'] != null ? ' · ${a['location']['district']}' : ''}',
              )),
            ],

            // Auditor note
            if (a['auditorNote'] != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(color: KColors.leaf.withOpacity(0.06), borderRadius: BorderRadius.circular(14), border: Border.all(color: KColors.leaf.withOpacity(0.2))),
                child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Icon(Icons.verified_user, color: KColors.leaf, size: 18),
                  const SizedBox(width: 10),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Text('Auditor Review', style: TextStyle(fontWeight: FontWeight.w700, color: KColors.forest, fontSize: 13)),
                    const SizedBox(height: 3),
                    Text(a['auditorNote'] as String, style: const TextStyle(color: KColors.ash, fontSize: 13, height: 1.4)),
                  ])),
                ]),
              ),
            ],

            // Blockchain
            const SizedBox(height: 12),
            _Card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                const Icon(Icons.link, color: Color(0xFF7B4FD4), size: 18),
                const SizedBox(width: 8),
                const Text('Blockchain Record', style: TextStyle(fontWeight: FontWeight.w700, color: KColors.forest, fontSize: 14)),
              ]),
              const SizedBox(height: 10),
              if (a['blockchainTxHash'] != null)
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5), decoration: BoxDecoration(color: const Color(0xFF7B4FD4).withOpacity(0.1), borderRadius: BorderRadius.circular(8)), child: const Text('✓ Recorded on Polygon', style: TextStyle(color: Color(0xFF7B4FD4), fontWeight: FontWeight.w700, fontSize: 12))),
                  const SizedBox(height: 8),
                  Text(a['blockchainTxHash'] as String, style: const TextStyle(fontSize: 11, fontFamily: 'monospace', color: KColors.fog), maxLines: 2, overflow: TextOverflow.ellipsis),
                ])
              else
                const Text('Not yet recorded on blockchain', style: TextStyle(color: KColors.fog, fontSize: 13)),
            ])),

            const SizedBox(height: 80),
          ]),
        )),
      ]),
    );
  }

  Widget _Stat(String val, String label) => Column(children: [
    Text(val, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: KColors.forest, fontFamily: 'monospace')),
    Text(label, style: const TextStyle(fontSize: 11, color: KColors.fog)),
  ]);

  Widget _divider() => Container(width: 1, height: 32, color: KColors.cloud);
}

class _Card extends StatelessWidget {
  final Widget child;
  const _Card({required this.child});
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), border: Border.all(color: KColors.cloud)),
    child: child,
  );
}
