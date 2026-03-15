import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../utils/constants.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});
  @override State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  List _activities = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await context.read<ApiService>().getMapActivities();
      setState(() { _activities = (data['activities'] as List? ?? []).where((a) => a['location']?['coordinates'] != null).toList(); _loading = false; });
    } catch (_) { setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Activity Map (${_activities.length} locations)')),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: KColors.leaf))
          : Stack(children: [
              // Placeholder – swap for GoogleMap widget with real API key
              Container(
                color: const Color(0xFFE8F5E9),
                child: Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                  const Icon(Icons.map, size: 64, color: KColors.cloud),
                  const SizedBox(height: 12),
                  const Text('Kerala Activity Map', style: TextStyle(fontWeight: FontWeight.w700, color: KColors.forest, fontSize: 18)),
                  const SizedBox(height: 4),
                  Text('${_activities.length} activities loaded', style: const TextStyle(color: KColors.fog)),
                  const SizedBox(height: 16),
                  const Text('Add GOOGLE_MAPS_API_KEY\nto enable live map', style: TextStyle(color: KColors.fog, fontSize: 12, height: 1.5), textAlign: TextAlign.center),
                ])),
              ),
              // Activity list overlay at bottom
              Positioned(
                bottom: 0, left: 0, right: 0,
                child: Container(
                  height: 180,
                  decoration: BoxDecoration(color: Colors.white, borderRadius: const BorderRadius.vertical(top: Radius.circular(20)), boxShadow: [BoxShadow(color: KColors.forest.withOpacity(0.1), blurRadius: 20)]),
                  child: Column(children: [
                    Container(margin: const EdgeInsets.only(top: 8), width: 36, height: 4, decoration: BoxDecoration(color: KColors.cloud, borderRadius: BorderRadius.circular(2))),
                    Expanded(child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      itemCount: _activities.length,
                      itemBuilder: (ctx, i) {
                        final a = _activities[i];
                        final cfg = ActivityConfig.types[a['type']] ?? ActivityConfig.types['tree_planting']!;
                        return Container(
                          width: 160, margin: const EdgeInsets.only(right: 10),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(color: KColors.ivory, borderRadius: BorderRadius.circular(12), border: Border.all(color: KColors.cloud)),
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
                            Text(cfg['emoji'] as String, style: const TextStyle(fontSize: 20)),
                            const SizedBox(height: 4),
                            Text(a['title'] as String? ?? 'Activity', style: const TextStyle(fontWeight: FontWeight.w600, color: KColors.charcoal, fontSize: 12), maxLines: 1, overflow: TextOverflow.ellipsis),
                            Text('${(a['carbonSaved'] as num?)?.toStringAsFixed(1) ?? 0} kg CO₂', style: TextStyle(fontSize: 11, color: cfg['color'] as Color, fontWeight: FontWeight.w600)),
                          ]),
                        );
                      },
                    )),
                  ]),
                ),
              ),
            ]),
    );
  }
}

