import 'dart:io';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:geolocator/geolocator.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../utils/constants.dart';

class SubmitActivityScreen extends StatefulWidget {
  const SubmitActivityScreen({super.key});
  @override State<SubmitActivityScreen> createState() => _SubmitActivityScreenState();
}

class _SubmitActivityScreenState extends State<SubmitActivityScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _quantityCtrl = TextEditingController();
  final _districtCtrl = TextEditingController();

  int _step = 0; // 0=type, 1=details, 2=location, 3=review
  String? _selectedType;
  List<File> _photos = [];
  Position? _position;
  bool _locating = false, _submitting = false;
  Map<String, dynamic>? _result;

  final _picker = ImagePicker();

  Map<String, dynamic>? get _typeCfg => _selectedType != null ? ActivityConfig.types[_selectedType] : null;

  double get _carbonPreview {
    if (_selectedType == null) return 0;
    final q = double.tryParse(_quantityCtrl.text) ?? 0;
    return ActivityConfig.calculateCarbon(_selectedType!, q);
  }

  double get _creditsPreview => ActivityConfig.carbonToCredits(_carbonPreview);

  // Pick photos
  Future<void> _pickPhotos() async {
    final picked = await _picker.pickMultiImage(imageQuality: 70);
    if (picked.isNotEmpty) {
      setState(() {
        _photos.addAll(picked.take(5 - _photos.length).map((x) => File(x.path)));
      });
    }
  }

  // Take photo with camera
  Future<void> _takePhoto() async {
    final picked = await _picker.pickImage(source: ImageSource.camera, imageQuality: 70);
    if (picked != null && _photos.length < 5) {
      setState(() => _photos.add(File(picked.path)));
    }
  }

  // Get GPS
  Future<void> _getLocation() async {
    setState(() => _locating = true);
    try {
      LocationPermission perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.denied || perm == LocationPermission.deniedForever) {
        throw Exception('Location permission denied');
      }
      final pos = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
      setState(() => _position = pos);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('📍 Location captured!'), backgroundColor: KColors.leaf),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Location error: $e'), backgroundColor: KColors.coral),
        );
      }
    } finally {
      if (mounted) setState(() => _locating = false);
    }
  }

  // Submit
  Future<void> _submit() async {
    if (_photos.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Add at least one photo')));
      return;
    }
    setState(() => _submitting = true);
    try {
      final api = context.read<ApiService>();
      final quantity = double.parse(_quantityCtrl.text);
      final data = await api.submitActivity(
        type: _selectedType!,
        title: _titleCtrl.text.trim().isEmpty
            ? '${_typeCfg!['label']} – ${DateTime.now().toLocal().toString().substring(0, 10)}'
            : _titleCtrl.text.trim(),
        description: _descCtrl.text.trim(),
        quantity: quantity,
        lat: _position?.latitude,
        lng: _position?.longitude,
        district: _districtCtrl.text.trim(),
        photos: _photos,
      );
      await context.read<AuthService>().refreshUser();
      setState(() => _result = data);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: KColors.coral));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_result != null) return _buildSuccess();

    return Scaffold(
      backgroundColor: KColors.ivory,
      appBar: AppBar(
        title: const Text('Log Green Activity'),
        leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => context.pop()),
      ),
      body: Column(children: [
        _buildStepBar(),
        Expanded(child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: [
            _buildStep0(),
            _buildStep1(),
            _buildStep2(),
            _buildStep3(),
          ][_step],
        )),
      ]),
    );
  }

  // Step bar
  Widget _buildStepBar() {
    const labels = ['Type', 'Details', 'Location', 'Review'];
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      child: Row(children: List.generate(4, (i) {
        final done = _step > i, active = _step == i;
        final color = done || active ? KColors.canopy : KColors.fog;
        return Expanded(child: Row(children: [
          Container(
            width: 26, height: 26,
            decoration: BoxDecoration(
              color: done ? KColors.leaf : active ? KColors.canopy.withOpacity(0.1) : Colors.transparent,
              border: Border.all(color: color, width: active || done ? 2 : 1),
              shape: BoxShape.circle,
            ),
            child: Center(child: done
                ? const Icon(Icons.check, color: Colors.white, size: 14)
                : Text('${i+1}', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: color))),
          ),
          const SizedBox(width: 4),
          Text(labels[i], style: TextStyle(fontSize: 11, fontWeight: active ? FontWeight.w700 : FontWeight.w400, color: color)),
          if (i < 3) Expanded(child: Container(height: 1, color: i < _step ? KColors.leaf : KColors.cloud, margin: const EdgeInsets.only(left: 6))),
        ]));
      })),
    );
  }

  // Step 0: Choose type
  Widget _buildStep0() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    const Text('What are you logging?', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: KColors.forest)),
    const SizedBox(height: 6),
    const Text('Select the green activity you performed', style: TextStyle(color: KColors.fog)),
    const SizedBox(height: 24),
    ...ActivityConfig.types.entries.map((e) {
      final cfg = e.value; final color = cfg['color'] as Color;
      final selected = _selectedType == e.key;
      return GestureDetector(
        onTap: () => setState(() => _selectedType = e.key),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: selected ? color.withOpacity(0.08) : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: selected ? color : KColors.cloud, width: selected ? 2 : 1),
          ),
          child: Row(children: [
            Container(width: 48, height: 48, decoration: BoxDecoration(color: color.withOpacity(0.15), borderRadius: BorderRadius.circular(12)), child: Icon(cfg['icon'] as IconData, color: color, size: 24)),
            const SizedBox(width: 14),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(cfg['label'] as String, style: const TextStyle(fontWeight: FontWeight.w700, color: KColors.charcoal, fontSize: 15)),
              const SizedBox(height: 2),
              Text(cfg['rateLabel'] as String, style: TextStyle(fontSize: 12, color: color, fontWeight: FontWeight.w500)),
            ])),
            if (selected) Container(width: 22, height: 22, decoration: BoxDecoration(color: color, shape: BoxShape.circle), child: const Icon(Icons.check, color: Colors.white, size: 14)),
          ]),
        ),
      );
    }),
    const SizedBox(height: 24),
    SizedBox(width: double.infinity, child: ElevatedButton(
      onPressed: _selectedType == null ? null : () => setState(() => _step = 1),
      child: const Text('Continue →'),
    )),
  ]);

  // Step 1: Details + photos
  Widget _buildStep1() {
    final cfg = _typeCfg;
    if (cfg == null) return const SizedBox();
    final color = cfg['color'] as Color;
    return Form(key: _formKey, child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      // Type hint
      Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: color.withOpacity(0.07), borderRadius: BorderRadius.circular(12)),
        child: Row(children: [
          Icon(cfg['icon'] as IconData, color: color, size: 20),
          const SizedBox(width: 10),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(cfg['label'] as String, style: const TextStyle(fontWeight: FontWeight.w700, color: KColors.forest)),
            Text(cfg['rateLabel'] as String, style: TextStyle(fontSize: 12, color: color)),
          ])),
        ]),
      ),
      const SizedBox(height: 20),

      // Quantity
      TextFormField(
        controller: _quantityCtrl,
        keyboardType: const TextInputType.numberWithOptions(decimal: true),
        onChanged: (_) => setState(() {}),
        decoration: InputDecoration(
          labelText: '${cfg['unit'] as String} count *',
          suffixText: cfg['unit'] as String,
          suffixStyle: TextStyle(color: color, fontWeight: FontWeight.w600),
        ),
        validator: (v) => v == null || v.isEmpty || double.tryParse(v) == null ? 'Enter valid number' : null,
      ),

      // Carbon preview
      if (_carbonPreview > 0) ...[
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(color: KColors.leaf.withOpacity(0.08), borderRadius: BorderRadius.circular(10)),
          child: Row(children: [
            const Icon(Icons.eco, color: KColors.leaf, size: 16),
            const SizedBox(width: 8),
            Text('~${_carbonPreview.toStringAsFixed(1)} kg CO₂ saved', style: const TextStyle(fontWeight: FontWeight.w600, color: KColors.leaf)),
            const Spacer(),
            Text('${_creditsPreview.toStringAsFixed(4)} credits', style: const TextStyle(fontSize: 12, color: KColors.gold, fontWeight: FontWeight.w600)),
          ]),
        ),
      ],

      const SizedBox(height: 14),
      TextFormField(controller: _titleCtrl, decoration: const InputDecoration(labelText: 'Title (optional)')),
      const SizedBox(height: 14),
      TextFormField(controller: _descCtrl, maxLines: 3, decoration: const InputDecoration(labelText: 'Description', alignLabelWithHint: true)),
      const SizedBox(height: 20),

      // Photos
      const Text('Photo Evidence *', style: TextStyle(fontWeight: FontWeight.w600, color: KColors.charcoal)),
      const SizedBox(height: 8),
      if (_photos.isEmpty)
        GestureDetector(
          onTap: _pickPhotos,
          child: Container(
            height: 120,
            decoration: BoxDecoration(border: Border.all(color: KColors.cloud, width: 2, style: BorderStyle.none), borderRadius: BorderRadius.circular(14), color: KColors.ivory),
            child: const Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
              Icon(Icons.add_photo_alternate_outlined, color: KColors.fog, size: 36),
              SizedBox(height: 8),
              Text('Add Photos', style: TextStyle(color: KColors.fog, fontWeight: FontWeight.w500)),
              Text('Max 5 photos, 10MB each', style: TextStyle(color: KColors.cloud, fontSize: 11)),
            ])),
          ),
        )
      else
        Column(children: [
          SizedBox(
            height: 100,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: _photos.length + 1,
              itemBuilder: (ctx, i) {
                if (i == _photos.length && _photos.length < 5) {
                  return GestureDetector(
                    onTap: _pickPhotos,
                    child: Container(width: 100, height: 100, margin: const EdgeInsets.only(right: 8), decoration: BoxDecoration(color: KColors.ivory, borderRadius: BorderRadius.circular(12), border: Border.all(color: KColors.cloud)), child: const Icon(Icons.add, color: KColors.fog)),
                  );
                }
                if (i >= _photos.length) return const SizedBox();
                return Stack(children: [
                  Container(width: 100, height: 100, margin: const EdgeInsets.only(right: 8), decoration: BoxDecoration(borderRadius: BorderRadius.circular(12)), clipBehavior: Clip.antiAlias, child: Image.file(_photos[i], fit: BoxFit.cover)),
                  Positioned(top: 4, right: 12, child: GestureDetector(
                    onTap: () => setState(() => _photos.removeAt(i)),
                    child: Container(width: 20, height: 20, decoration: const BoxDecoration(color: KColors.coral, shape: BoxShape.circle), child: const Icon(Icons.close, color: Colors.white, size: 13)),
                  )),
                ]);
              },
            ),
          ),
          const SizedBox(height: 8),
          Row(children: [
            TextButton.icon(onPressed: _pickPhotos, icon: const Icon(Icons.photo_library_outlined, size: 16), label: const Text('Gallery')),
            TextButton.icon(onPressed: _takePhoto,  icon: const Icon(Icons.camera_alt_outlined,   size: 16), label: const Text('Camera')),
          ]),
        ]),

      const SizedBox(height: 24),
      Row(children: [
        OutlinedButton(onPressed: () => setState(() => _step = 0), child: const Text('← Back')),
        const SizedBox(width: 12),
        Expanded(child: ElevatedButton(
          onPressed: (_quantityCtrl.text.isEmpty || _photos.isEmpty) ? null : () => setState(() => _step = 2),
          child: const Text('Continue →'),
        )),
      ]),
    ]));
  }

  // Step 2: Location
  Widget _buildStep2() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    const Text('GPS Location', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: KColors.forest)),
    const Text('Optional but recommended for verification', style: TextStyle(color: KColors.fog)),
    const SizedBox(height: 24),
    SizedBox(width: double.infinity, child: ElevatedButton.icon(
      onPressed: _locating ? null : _getLocation,
      icon: _locating ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Icon(Icons.my_location),
      label: Text(_locating ? 'Getting location…' : _position != null ? 'Update Location' : 'Capture GPS'),
    )),
    if (_position != null) ...[
      const SizedBox(height: 14),
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(color: KColors.leaf.withOpacity(0.08), borderRadius: BorderRadius.circular(10)),
        child: Row(children: [
          const Icon(Icons.location_pin, color: KColors.coral, size: 18),
          const SizedBox(width: 8),
          Text('${_position!.latitude.toStringAsFixed(5)}, ${_position!.longitude.toStringAsFixed(5)}', style: const TextStyle(fontSize: 12, fontFamily: 'monospace', color: KColors.ash)),
        ]),
      ),
    ],
    const SizedBox(height: 20),
    DropdownButtonFormField<String>(
      value: _districtCtrl.text.isEmpty ? null : _districtCtrl.text,
      decoration: const InputDecoration(labelText: 'District'),
      items: KDistricts.all.map((d) => DropdownMenuItem(value: d, child: Text(d))).toList(),
      onChanged: (v) => _districtCtrl.text = v ?? '',
    ),
    const SizedBox(height: 24),
    Row(children: [
      OutlinedButton(onPressed: () => setState(() => _step = 1), child: const Text('← Back')),
      const SizedBox(width: 12),
      Expanded(child: ElevatedButton(onPressed: () => setState(() => _step = 3), child: const Text('Continue →'))),
    ]),
  ]);

  // Step 3: Review
  Widget _buildStep3() {
    final cfg = _typeCfg!;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Text('Review & Submit', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: KColors.forest)),
      const SizedBox(height: 20),
      Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: KColors.cloud)),
        child: Column(children: [
          _ReviewRow('Activity', cfg['label'] as String),
          _ReviewRow('Quantity', '${_quantityCtrl.text} ${cfg['unit']}'),
          _ReviewRow('CO₂ Estimate', '~${_carbonPreview.toStringAsFixed(1)} kg', color: KColors.leaf),
          _ReviewRow('Credits to Earn', _creditsPreview.toStringAsFixed(4), color: KColors.gold),
          _ReviewRow('Photos', '${_photos.length} uploaded'),
          _ReviewRow('GPS', _position != null ? '📍 Captured' : 'Not provided'),
          if (_districtCtrl.text.isNotEmpty) _ReviewRow('District', _districtCtrl.text),
        ]),
      ),
      const SizedBox(height: 16),
      Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: KColors.sky.withOpacity(0.07), borderRadius: BorderRadius.circular(12)),
        child: const Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Icon(Icons.info_outline, color: KColors.sky, size: 18),
          SizedBox(width: 8),
          Expanded(child: Text('Your photo will be analyzed by AI. An auditor may also review before credits are issued.', style: TextStyle(fontSize: 12, color: KColors.sky))),
        ]),
      ),
      const SizedBox(height: 24),
      Row(children: [
        OutlinedButton(onPressed: _submitting ? null : () => setState(() => _step = 2), child: const Text('← Back')),
        const SizedBox(width: 12),
        Expanded(child: ElevatedButton(
          onPressed: _submitting ? null : _submit,
          style: ElevatedButton.styleFrom(backgroundColor: KColors.leaf, padding: const EdgeInsets.symmetric(vertical: 15)),
          child: _submitting
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Row(mainAxisAlignment: MainAxisAlignment.center, children: [Text('🌱  Submit Activity', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700))]),
        )),
      ]),
    ]);
  }

  Widget _ReviewRow(String label, String value, {Color? color}) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 8),
    child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      Text(label, style: const TextStyle(color: KColors.fog, fontSize: 13)),
      Text(value, style: TextStyle(fontWeight: FontWeight.w700, color: color ?? KColors.charcoal, fontSize: 13)),
    ]),
  );

  // Success screen
  Widget _buildSuccess() {
    final act = _result!['activity'];
    return Scaffold(
      backgroundColor: KColors.ivory,
      body: SafeArea(child: Center(child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(
            width: 80, height: 80,
            decoration: BoxDecoration(color: KColors.leaf.withOpacity(0.12), shape: BoxShape.circle),
            child: const Icon(Icons.check_circle_outline, color: KColors.leaf, size: 48),
          ),
          const SizedBox(height: 20),
          const Text('Activity Submitted! 🌿', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: KColors.forest)),
          const SizedBox(height: 8),
          const Text('Your activity is pending verification', style: TextStyle(color: KColors.fog)),
          const SizedBox(height: 28),
          Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            _ResultStat('${(act['carbonSaved'] as num).toStringAsFixed(1)}', 'kg CO₂'),
            const SizedBox(width: 24),
            _ResultStat('${(act['carbonCreditsEarned'] as num).toStringAsFixed(4)}', 'credits'),
            const SizedBox(width: 24),
            _ResultStat('${_result!['aiVerification']?['confidence'] ?? 0}%', 'AI score'),
          ]),
          const SizedBox(height: 32),
          SizedBox(width: double.infinity, child: ElevatedButton(onPressed: () => context.go('/activities'), child: const Text('View My Activities'))),
          const SizedBox(height: 12),
          SizedBox(width: double.infinity, child: OutlinedButton(onPressed: () => context.go('/activities/submit'), child: const Text('Submit Another'))),
        ]),
      ))),
    );
  }
}

class _ResultStat extends StatelessWidget {
  final String value, label;
  const _ResultStat(this.value, this.label);

  @override
  Widget build(BuildContext context) => Column(children: [
    Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: KColors.leaf, fontFamily: 'monospace')),
    Text(label, style: const TextStyle(fontSize: 11, color: KColors.fog)),
  ]);
}
