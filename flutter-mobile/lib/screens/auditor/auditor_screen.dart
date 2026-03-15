import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../utils/constants.dart';
import '../../widgets/k_widgets.dart';

class AuditorScreen extends StatefulWidget {
  const AuditorScreen({super.key});
  @override State<AuditorScreen> createState() => _AuditorScreenState();
}

class _AuditorScreenState extends State<AuditorScreen> {
  List _pending = [];
  bool _loading = true;
  String? _selectedId;
  String? _decision;
  final _noteCtrl = TextEditingController();
  bool _processing = false;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final data = await context.read<ApiService>().getPendingActivities();
      setState(() { _pending = data['activities'] ?? []; _loading = false; });
    } catch (_) { setState(() => _loading = false); }
  }

  Future<void> _verify() async {
    if (_selectedId == null || _decision == null) return;
    if (_decision == 'reject' && _noteCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Add rejection note')));
      return;
    }
    setState(() => _processing = true);
    try {
      final data = await context.read<ApiService>().verifyActivity(_selectedId!, _decision!, _noteCtrl.text.trim().isEmpty ? null : _noteCtrl.text.trim());
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(_decision == 'approve' ? '✅ Approved! ${(data['creditsIssued'] as num?)?.toStringAsFixed(4) ?? 0} credits issued' : '❌ Rejected'),
        backgroundColor: _decision == 'approve' ? KColors.leaf : KColors.coral,
      ));
      setState(() { _selectedId = null; _decision = null; _noteCtrl.clear(); });
      _load();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: KColors.coral));
    } finally { setState(() => _processing = false); }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: KColors.ivory,
      appBar: AppBar(title: const Text('Auditor Panel'), actions: [IconButton(icon: const Icon(Icons.refresh), onPressed: _load)]),
      body: _loading
          ? ListView.builder(padding: const EdgeInsets.all(16), itemCount: 6, itemBuilder: (_, __) => Padding(padding: const EdgeInsets.only(bottom: 10), child: KShimmer(height: 80)))
          : _pending.isEmpty
              ? const Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.verified_user, size: 56, color: KColors.cloud),
                  SizedBox(height: 12),
                  Text('All caught up! 🎉', style: TextStyle(fontWeight: FontWeight.w700, color: KColors.charcoal, fontSize: 18)),
                  Text('No pending activities', style: TextStyle(color: KColors.fog)),
                ]))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _pending.length,
                  itemBuilder: (ctx, i) {
                    final a = _pending[i];
                    final isSelected = _selectedId == a['_id'];
                    final cfg = ActivityConfig.types[a['type']] ?? ActivityConfig.types['tree_planting']!;
                    final color = cfg['color'] as Color;
                    return GestureDetector(
                      onTap: () => setState(() { _selectedId = isSelected ? null : a['_id']; _decision = null; _noteCtrl.clear(); }),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 180),
                        margin: const EdgeInsets.only(bottom: 10),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: isSelected ? KColors.canopy : KColors.cloud, width: isSelected ? 2 : 1),
                          boxShadow: isSelected ? [BoxShadow(color: KColors.canopy.withOpacity(0.1), blurRadius: 10, offset: const Offset(0, 4))] : null,
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(14),
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Row(children: [
                              Container(width: 44, height: 44, decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(11)), child: Center(child: Text(cfg['emoji'] as String, style: const TextStyle(fontSize: 22)))),
                              const SizedBox(width: 12),
                              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                Text(a['title'] as String? ?? 'Activity', style: const TextStyle(fontWeight: FontWeight.w700, color: KColors.charcoal), maxLines: 1, overflow: TextOverflow.ellipsis),
                                Text('${a['user']?['name']} · ${a['user']?['district'] ?? 'Kerala'}', style: const TextStyle(fontSize: 12, color: KColors.fog)),
                              ])),
                              Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                                Text('${(a['carbonSaved'] as num?)?.toStringAsFixed(1) ?? 0} kg', style: TextStyle(fontWeight: FontWeight.w800, color: color, fontFamily: 'monospace')),
                                if (a['isFlagged'] == true) const Text('⚠️ Flagged', style: TextStyle(fontSize: 10, color: KColors.gold, fontWeight: FontWeight.w600)),
                              ]),
                            ]),

                            if (isSelected) ...[
                              const Divider(height: 20),
                              if (a['aiVerification']?['analyzed'] == true) Container(
                                padding: const EdgeInsets.all(10), margin: const EdgeInsets.only(bottom: 10),
                                decoration: BoxDecoration(color: KColors.sky.withOpacity(0.07), borderRadius: BorderRadius.circular(10)),
                                child: Text('🤖 AI: ${a['aiVerification']['confidence']}% confidence — ${a['aiVerification']['analysisDetails'] ?? ''}', style: const TextStyle(fontSize: 12, color: KColors.sky)),
                              ),
                              Row(children: [
                                Expanded(child: _DecisionBtn(label: 'Approve ✅', active: _decision == 'approve', color: KColors.leaf, onTap: () => setState(() => _decision = 'approve'))),
                                const SizedBox(width: 10),
                                Expanded(child: _DecisionBtn(label: 'Reject ❌', active: _decision == 'reject', color: KColors.coral, onTap: () => setState(() => _decision = 'reject'))),
                              ]),
                              const SizedBox(height: 10),
                              TextField(
                                controller: _noteCtrl,
                                maxLines: 2,
                                decoration: InputDecoration(
                                  hintText: _decision == 'reject' ? 'Rejection reason (required)…' : 'Optional note…',
                                  hintStyle: const TextStyle(fontSize: 13),
                                ),
                              ),
                              const SizedBox(height: 10),
                              SizedBox(width: double.infinity, child: ElevatedButton(
                                onPressed: (_processing || _decision == null) ? null : _verify,
                                style: ElevatedButton.styleFrom(backgroundColor: _decision == 'approve' ? KColors.leaf : KColors.coral),
                                child: _processing ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : Text(_decision == 'approve' ? 'Confirm Approval' : _decision == 'reject' ? 'Confirm Rejection' : 'Select a decision'),
                              )),
                            ],
                          ]),
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}

class _DecisionBtn extends StatelessWidget {
  final String label; final bool active; final Color color; final VoidCallback onTap;
  const _DecisionBtn({required this.label, required this.active, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: AnimatedContainer(
      duration: const Duration(milliseconds: 150),
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(
        color: active ? color.withOpacity(0.12) : Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: active ? color : KColors.cloud, width: active ? 2 : 1),
      ),
      child: Center(child: Text(label, style: TextStyle(fontWeight: FontWeight.w700, color: active ? color : KColors.fog, fontSize: 13))),
    ),
  );
}

