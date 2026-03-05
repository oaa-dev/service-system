import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class AppLoadingIndicator extends StatefulWidget {
  final Color? color;
  final double size;
  final bool _fullScreen;

  const AppLoadingIndicator({
    super.key,
    this.color,
    this.size = 24,
  }) : _fullScreen = false;

  const AppLoadingIndicator.fullScreen({super.key})
      : color = null,
        size = 32,
        _fullScreen = true;

  @override
  State<AppLoadingIndicator> createState() => _AppLoadingIndicatorState();
}

class _AppLoadingIndicatorState extends State<AppLoadingIndicator>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _scaleAnimation;
  late final Animation<double> _opacityAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);

    _scaleAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );

    _opacityAnimation = Tween<double>(begin: 0.4, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final dotColor = widget.color ?? AppColors.primary;
    final dotSize = widget.size * 0.3;
    final spacing = widget.size * 0.15;

    final dots = Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(3, (index) {
        // Stagger the animation for each dot
        final delay = index * 0.2;
        return AnimatedBuilder(
          animation: _controller,
          builder: (context, child) {
            // Create a staggered effect per dot
            final progress = (_controller.value + delay) % 1.0;
            final curvedProgress = Curves.easeInOut.transform(
              progress < 0.5 ? progress * 2.0 : 2.0 - progress * 2.0,
            );

            return Container(
              margin: EdgeInsets.symmetric(horizontal: spacing),
              child: Transform.scale(
                scale: 0.7 + 0.3 * curvedProgress,
                child: Opacity(
                  opacity: 0.4 + 0.6 * curvedProgress,
                  child: Container(
                    width: dotSize,
                    height: dotSize,
                    decoration: BoxDecoration(
                      color: dotColor,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
              ),
            );
          },
        );
      }),
    );

    final indicator = SizedBox(
      width: widget.size * 1.8,
      height: widget.size,
      child: Center(child: dots),
    );

    if (widget._fullScreen) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ScaleTransition(
                scale: _scaleAnimation,
                child: FadeTransition(
                  opacity: _opacityAnimation,
                  child: Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      gradient: AppColors.primaryGradient,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Icon(
                      Icons.storefront_rounded,
                      color: AppColors.white,
                      size: 28,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              indicator,
            ],
          ),
        ),
      );
    }

    return Center(child: indicator);
  }
}
