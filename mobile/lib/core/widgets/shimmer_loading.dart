import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// A shimmer placeholder widget for loading states.
///
/// Can be used in two ways:
/// 1. **Standalone** (no child): renders a rounded rectangle placeholder
///    with configurable [width], [height], and [borderRadius].
/// 2. **Wrapper** (with child): wraps any widget in a shimmer sweep effect.
class ShimmerLoading extends StatefulWidget {
  final Widget? child;
  final double width;
  final double height;
  final double borderRadius;

  /// Standalone shimmer rectangle.
  const ShimmerLoading({
    super.key,
    this.width = double.infinity,
    this.height = 16,
    this.borderRadius = 8,
  }) : child = null;

  /// Wrapper mode — wraps [child] in a shimmer sweep.
  const ShimmerLoading.wrap({
    super.key,
    required Widget this.child,
  })  : width = 0,
        height = 0,
        borderRadius = 0;

  @override
  State<ShimmerLoading> createState() => _ShimmerLoadingState();
}

class _ShimmerLoadingState extends State<ShimmerLoading>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final inner = widget.child ??
        Container(
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            color: AppColors.grey200,
            borderRadius: BorderRadius.circular(widget.borderRadius),
          ),
        );

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final slidePosition = _controller.value * 2.0 - 0.5;
        return ShaderMask(
          blendMode: BlendMode.srcATop,
          shaderCallback: (bounds) {
            return LinearGradient(
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
              colors: const [
                Color(0xFFEEEBE8),
                Color(0xFFF8F6F3),
                Color(0xFFEEEBE8),
              ],
              stops: [
                (slidePosition - 0.3).clamp(0.0, 1.0),
                slidePosition.clamp(0.0, 1.0),
                (slidePosition + 0.3).clamp(0.0, 1.0),
              ],
            ).createShader(bounds);
          },
          child: child,
        );
      },
      child: inner,
    );
  }
}

/// A shimmer placeholder that mimics a vertical merchant card layout.
///
/// Shows a full-width image area (200px), title/subtitle placeholders,
/// and capability chip placeholders — matching the MerchantCard design.
class ShimmerCard extends StatelessWidget {
  const ShimmerCard({super.key});

  @override
  Widget build(BuildContext context) {
    return ShimmerLoading.wrap(
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: AppColors.grey900.withValues(alpha: 0.04),
              blurRadius: 20,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image placeholder
            Container(
              height: 200,
              width: double.infinity,
              color: AppColors.grey200,
            ),
            // Info section placeholder
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
              child: Row(
                children: [
                  Container(
                    height: 28,
                    width: 60,
                    decoration: BoxDecoration(
                      color: AppColors.grey200,
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    height: 28,
                    width: 60,
                    decoration: BoxDecoration(
                      color: AppColors.grey200,
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  const Spacer(),
                  Container(
                    height: 28,
                    width: 60,
                    decoration: BoxDecoration(
                      color: AppColors.grey200,
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
