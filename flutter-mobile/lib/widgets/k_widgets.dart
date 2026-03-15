import 'package:flutter/material.dart';
import '../utils/constants.dart';

// ── Stat Card ──────────────────────────────────────────────────────────────

class KStatCard extends StatelessWidget {
  final String label;
  final String value;
  final String? sub;
  final Color color;
  final IconData icon;

  const KStatCard({
    super.key,
    required this.label,
    required this.value,
    this.sub,
    required this.color,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: KColors.snow,
        borderRadius: BorderRadius.circular(KRadius.lg),
        border: Border.all(color: KColors.cloud),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40, height: 40,
            decoration: BoxDecoration(
              color: color.withOpacity(0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(height: 12),
          Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: KColors.forest, fontFamily: 'monospace')),
          const SizedBox(height: 2),
          Text(label, style: const TextStyle(fontSize: 11, color: KColors.fog, letterSpacing: 0.5)),
          if (sub != null) ...[
            const SizedBox(height: 2),
            Text(sub!, style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.w600)),
          ],
        ],
      ),
    );
  }
}

// ── Activity Badge ─────────────────────────────────────────────────────────

class KActivityBadge extends StatelessWidget {
  final String type;
  const KActivityBadge(this.type, {super.key});

  @override
  Widget build(BuildContext context) {
    final cfg = ActivityConfig.types[type] ?? ActivityConfig.types['tree_planting']!;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: (cfg['color'] as Color).withOpacity(0.12),
        borderRadius: BorderRadius.circular(KRadius.full),
      ),
      child: Text(
        '${cfg['emoji']} ${cfg['label']}',
        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: cfg['color'] as Color),
      ),
    );
  }
}

// ── Status Badge ───────────────────────────────────────────────────────────

class KStatusBadge extends StatelessWidget {
  final String status;
  const KStatusBadge(this.status, {super.key});

  @override
  Widget build(BuildContext context) {
    final cfg = ActivityConfig.statuses[status] ?? {'label': status, 'color': KColors.fog};
    final color = cfg['color'] as Color;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(KRadius.full),
      ),
      child: Text(
        cfg['label'] as String,
        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: color),
      ),
    );
  }
}

// ── Green Button ───────────────────────────────────────────────────────────

class KGreenButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool loading;
  final IconData? icon;
  final bool outlined;

  const KGreenButton({
    super.key,
    required this.label,
    this.onPressed,
    this.loading = false,
    this.icon,
    this.outlined = false,
  });

  @override
  Widget build(BuildContext context) {
    if (outlined) {
      return OutlinedButton(
        onPressed: loading ? null : onPressed,
        style: OutlinedButton.styleFrom(
          foregroundColor: KColors.canopy,
          side: const BorderSide(color: KColors.canopy, width: 1.5),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(KRadius.md)),
          padding: const EdgeInsets.symmetric(vertical: 13, horizontal: 20),
        ),
        child: _child(),
      );
    }
    return ElevatedButton(
      onPressed: loading ? null : onPressed,
      child: _child(),
    );
  }

  Widget _child() {
    if (loading) return const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white));
    if (icon != null) return Row(mainAxisSize: MainAxisSize.min, children: [Icon(icon, size: 16), const SizedBox(width: 8), Text(label)]);
    return Text(label);
  }
}

// ── Carbon Score Ring ──────────────────────────────────────────────────────

class KCarbonRing extends StatelessWidget {
  final int score;
  final double size;

  const KCarbonRing({super.key, required this.score, this.size = 80});

  @override
  Widget build(BuildContext context) {
    final color = score >= 70 ? KColors.leaf : score >= 40 ? KColors.gold : KColors.coral;
    return SizedBox(
      width: size, height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          CircularProgressIndicator(
            value: score / 100,
            strokeWidth: 6,
            backgroundColor: KColors.cloud,
            valueColor: AlwaysStoppedAnimation(color),
          ),
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('$score', style: TextStyle(fontSize: size * 0.22, fontWeight: FontWeight.w800, color: KColors.forest)),
              Text('/100', style: TextStyle(fontSize: size * 0.1, color: KColors.fog)),
            ],
          ),
        ],
      ),
    );
  }
}

// ── Section Header ─────────────────────────────────────────────────────────

class KSectionHeader extends StatelessWidget {
  final String title;
  final String? action;
  final VoidCallback? onAction;

  const KSectionHeader({super.key, required this.title, this.action, this.onAction});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: KColors.forest)),
        if (action != null)
          TextButton(
            onPressed: onAction,
            style: TextButton.styleFrom(foregroundColor: KColors.canopy, padding: EdgeInsets.zero, minimumSize: Size.zero),
            child: Text(action!, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          ),
      ],
    );
  }
}

// ── Loading Shimmer ────────────────────────────────────────────────────────

class KShimmer extends StatefulWidget {
  final double height;
  final double? width;
  final double radius;

  const KShimmer({super.key, required this.height, this.width, this.radius = 12});

  @override
  State<KShimmer> createState() => _KShimmerState();
}

class _KShimmerState extends State<KShimmer> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200))..repeat();
    _anim = Tween(begin: -1.0, end: 2.0).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut));
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _anim,
      builder: (ctx, _) => Container(
        height: widget.height,
        width: widget.width ?? double.infinity,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(widget.radius),
          gradient: LinearGradient(
            begin: Alignment(_anim.value - 1, 0),
            end: Alignment(_anim.value, 0),
            colors: [KColors.cloud, KColors.ivory, KColors.cloud],
          ),
        ),
      ),
    );
  }
}

// ── Info Tile ──────────────────────────────────────────────────────────────

class KInfoTile extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;

  const KInfoTile({
    super.key,
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    this.trailing,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(KRadius.md),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
        child: Row(
          children: [
            Container(
              width: 42, height: 42,
              decoration: BoxDecoration(color: iconColor.withOpacity(0.12), borderRadius: BorderRadius.circular(10)),
              child: Icon(icon, color: iconColor, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: KColors.charcoal)),
                const SizedBox(height: 2),
                Text(subtitle, style: const TextStyle(fontSize: 12, color: KColors.fog)),
              ],
            )),
            if (trailing != null) trailing!,
          ],
        ),
      ),
    );
  }
}
