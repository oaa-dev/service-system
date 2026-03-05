import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme/app_colors.dart';

enum AppButtonVariant { primary, secondary, outline, text }

class AppButton extends StatefulWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;
  final AppButtonVariant variant;
  final Widget? leadingIcon;
  final double? width;
  final double height;

  const AppButton({
    super.key,
    required this.label,
    this.onPressed,
    this.isLoading = false,
    this.variant = AppButtonVariant.primary,
    this.leadingIcon,
    this.width,
    this.height = 52,
  });

  @override
  State<AppButton> createState() => _AppButtonState();
}

class _AppButtonState extends State<AppButton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _scaleController;
  late final Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _scaleController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 100),
      lowerBound: 0.0,
      upperBound: 1.0,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.97).animate(
      CurvedAnimation(parent: _scaleController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _scaleController.dispose();
    super.dispose();
  }

  void _onTapDown(TapDownDetails _) {
    if (!widget.isLoading && widget.onPressed != null) {
      _scaleController.forward();
    }
  }

  void _onTapUp(TapUpDetails _) {
    _scaleController.reverse();
  }

  void _onTapCancel() {
    _scaleController.reverse();
  }

  Widget _buildLoadingIndicator(Color color) {
    return _PulsingDots(color: color, size: 8);
  }

  @override
  Widget build(BuildContext context) {
    final child = widget.isLoading
        ? _buildLoadingIndicator(
            widget.variant == AppButtonVariant.primary
                ? AppColors.white
                : AppColors.primary,
          )
        : Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (widget.leadingIcon != null) ...[
                widget.leadingIcon!,
                const SizedBox(width: 8),
              ],
              Text(widget.label),
            ],
          );

    final buttonSize = Size(widget.width ?? double.infinity, widget.height);

    return GestureDetector(
      onTapDown: _onTapDown,
      onTapUp: _onTapUp,
      onTapCancel: _onTapCancel,
      child: AnimatedBuilder(
        animation: _scaleAnimation,
        builder: (context, builtChild) {
          return Transform.scale(
            scale: _scaleAnimation.value,
            child: builtChild,
          );
        },
        child: _buildButton(child, buttonSize),
      ),
    );
  }

  Widget _buildButton(Widget child, Size buttonSize) {
    switch (widget.variant) {
      case AppButtonVariant.primary:
        return _GradientButton(
          onPressed: widget.isLoading ? null : () {
            HapticFeedback.lightImpact();
            widget.onPressed?.call();
          },
          buttonSize: buttonSize,
          child: child,
        );
      case AppButtonVariant.secondary:
        return ElevatedButton(
          onPressed: widget.isLoading ? null : () {
            HapticFeedback.lightImpact();
            widget.onPressed?.call();
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primaryLight,
            foregroundColor: AppColors.primary,
            minimumSize: buttonSize,
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
          ),
          child: child,
        );
      case AppButtonVariant.outline:
        return OutlinedButton(
          onPressed: widget.isLoading ? null : () {
            HapticFeedback.lightImpact();
            widget.onPressed?.call();
          },
          style: OutlinedButton.styleFrom(
            minimumSize: buttonSize,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
          ),
          child: child,
        );
      case AppButtonVariant.text:
        return TextButton(
          onPressed: widget.isLoading ? null : widget.onPressed,
          child: child,
        );
    }
  }
}

/// A button with a gradient background (primary -> primaryDark).
class _GradientButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final Size buttonSize;
  final Widget child;

  const _GradientButton({
    required this.onPressed,
    required this.buttonSize,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    final isDisabled = onPressed == null;

    return Container(
      constraints: BoxConstraints(
        minWidth: buttonSize.width,
        minHeight: buttonSize.height,
      ),
      decoration: BoxDecoration(
        gradient: isDisabled ? null : AppColors.primaryGradient,
        color: isDisabled ? AppColors.grey300 : null,
        borderRadius: BorderRadius.circular(14),
        boxShadow: isDisabled
            ? null
            : [
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.3),
                  blurRadius: 8,
                  offset: const Offset(0, 3),
                ),
              ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onPressed,
          borderRadius: BorderRadius.circular(14),
          child: Container(
            alignment: Alignment.center,
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: DefaultTextStyle(
              style: const TextStyle(
                color: AppColors.white,
                fontWeight: FontWeight.w600,
                fontSize: 16,
              ),
              child: IconTheme(
                data: const IconThemeData(color: AppColors.white),
                child: child,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Pulsing dots indicator for button loading states.
class _PulsingDots extends StatefulWidget {
  final Color color;
  final double size;

  const _PulsingDots({required this.color, required this.size});

  @override
  State<_PulsingDots> createState() => _PulsingDotsState();
}

class _PulsingDotsState extends State<_PulsingDots>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(3, (index) {
        return AnimatedBuilder(
          animation: _controller,
          builder: (context, _) {
            final delay = index * 0.2;
            final progress = (_controller.value + delay) % 1.0;
            final opacity = progress < 0.5
                ? 0.3 + 0.7 * (progress * 2.0)
                : 0.3 + 0.7 * (2.0 - progress * 2.0);

            return Container(
              margin: const EdgeInsets.symmetric(horizontal: 2),
              width: widget.size,
              height: widget.size,
              decoration: BoxDecoration(
                color: widget.color.withValues(alpha: opacity),
                shape: BoxShape.circle,
              ),
            );
          },
        );
      }),
    );
  }
}
