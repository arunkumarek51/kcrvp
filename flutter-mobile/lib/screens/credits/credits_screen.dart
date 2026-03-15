import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../utils/constants.dart';
import '../../widgets/k_widgets.dart';

class CreditsScreen extends StatefulWidget {
  const CreditsScreen({super.key});
  @override State<CreditsScreen> createState() => _CreditsScreenState();
}

class _CreditsScreenState extends State<CreditsScreen> {
  List _credits = [];
  List _transactions = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final data = await context.read<ApiService>().getMyCredits();
      setState(() { _credits = data['credits'] ?? []; _transactions = data['transactions'] ?? []; _loading = false; });
    } catch (_) { setState(() => _loading = false); }
  }

  double get _total => (_credits as List).where((c) => c['status'] == 'active').fold(0.0, (s, c) => s + (c['amount'] as num).toDouble());

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: KColors.ivory,
      appBar: AppBar(title: const Text('Carbon Credits Wallet')),
      body: _loading
          ? ListView.builder(padding: const EdgeInsets.all(16), itemCount: 5, itemBuilder: (_, __) => Padding(padding: const EdgeInsets.only(bottom: 10), child: KShimmer(height: 72)))
          : RefreshIndicator(
              onRefresh: _load,
              color: KColors.leaf,
              child: ListView(padding: const EdgeInsets.fromLTRB(16, 12, 16, 100), children: [
                // Balance card
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(gradient: const LinearGradient(colors: [KColors.forest, KColors.canopy], begin: Alignment.topLeft, end: Alignment.bottomRight), borderRadius: BorderRadius.circular(20)),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Text('Available Credits', style: TextStyle(color: Colors.white54, fontSize: 12)),
                    const SizedBox(height: 6),
                    Text(_total.toStringAsFixed(4), style: const TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.w900, fontFamily: 'monospace')),
                    const Text('KCRVP Carbon Credits', style: TextStyle(color: Colors.white38, fontSize: 12)),
                  ]),
                ),

                const SizedBox(height: 20),
                const KSectionHeader(title: 'My Credits'),
                const SizedBox(height: 10),

                if (_credits.isEmpty)
                  const Padding(padding: EdgeInsets.symmetric(vertical: 24), child: Center(child: Text('No credits yet', style: TextStyle(color: KColors.fog))))
                else
                  ..._credits.map((c) => Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), border: Border.all(color: KColors.cloud)),
                    child: Row(children: [
                      Container(width: 44, height: 44, decoration: BoxDecoration(color: KColors.canopy.withOpacity(0.1), borderRadius: BorderRadius.circular(10)), child: const Icon(Icons.credit_card, color: KColors.canopy, size: 22)),
                      const SizedBox(width: 12),
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(c['creditId'] as String? ?? 'KCRVP Credit', style: const TextStyle(fontWeight: FontWeight.w600, color: KColors.charcoal, fontSize: 13), maxLines: 1, overflow: TextOverflow.ellipsis),
                        Text('Vintage ${c['vintage']} · ${c['status']}', style: const TextStyle(fontSize: 11, color: KColors.fog)),
                      ])),
                      Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                        Text((c['amount'] as num).toStringAsFixed(4), style: const TextStyle(fontWeight: FontWeight.w800, color: KColors.leaf, fontFamily: 'monospace')),
                        Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2), decoration: BoxDecoration(color: KColors.leaf.withOpacity(0.1), borderRadius: BorderRadius.circular(6)), child: const Text('credits', style: TextStyle(fontSize: 10, color: KColors.leaf))),
                      ]),
                    ]),
                  )),

                const SizedBox(height: 20),
                const KSectionHeader(title: 'Transaction History'),
                const SizedBox(height: 10),

                if (_transactions.isEmpty)
                  const Padding(padding: EdgeInsets.symmetric(vertical: 24), child: Center(child: Text('No transactions yet', style: TextStyle(color: KColors.fog))))
                else
                  ..._transactions.take(20).map((tx) {
                    final isCredit = tx['type'] == 'credit_earned' || tx['type'] == 'credit_bought';
                    return Container(
                      margin: const EdgeInsets.only(bottom: 6),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: KColors.cloud)),
                      child: Row(children: [
                        Container(width: 36, height: 36, decoration: BoxDecoration(color: isCredit ? KColors.leaf.withOpacity(0.1) : KColors.sky.withOpacity(0.1), borderRadius: BorderRadius.circular(9)), child: Icon(isCredit ? Icons.add : Icons.arrow_upward, color: isCredit ? KColors.leaf : KColors.sky, size: 16)),
                        const SizedBox(width: 10),
                        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(tx['description'] as String? ?? tx['type'], style: const TextStyle(fontWeight: FontWeight.w600, color: KColors.charcoal, fontSize: 13)),
                          if (tx['createdAt'] != null) Text(DateTime.parse(tx['createdAt']).toLocal().toString().substring(0,10), style: const TextStyle(fontSize: 11, color: KColors.fog)),
                        ])),
                        if (tx['amount'] != null) Text('${isCredit ? '+' : '-'}${(tx['amount'] as num).toStringAsFixed(4)}', style: TextStyle(fontWeight: FontWeight.w700, color: isCredit ? KColors.leaf : KColors.sky, fontFamily: 'monospace')),
                      ]),
                    );
                  }),
              ]),
            ),
    );
  }
}

