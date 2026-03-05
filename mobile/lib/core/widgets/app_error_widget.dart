import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import 'app_button.dart';

class AppErrorWidget extends StatelessWidget {
  final String message;
  final VoidCallback? onRetry;
  final bool fullScreen;

  const AppErrorWidget({
    super.key,
    required this.message,
    this.onRetry,
    this.fullScreen = false,
  });

  @override
  Widget build(BuildContext context) {
    final content = Container(
      margin: const EdgeInsets.symmetric(horizontal: 24),
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppColors.grey900.withValues(alpha: 0.06),
            blurRadius: 20,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: AppColors.accentLight,
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Center(
              child: Text(
                '(>_<)',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w700,
                  color: AppColors.accent,
                  letterSpacing: -1,
                ),
              ),
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'Oops, something went wrong',
            style: AppTypography.titleMedium,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            message,
            style: AppTypography.bodyMedium.copyWith(
              color: AppColors.grey500,
            ),
            textAlign: TextAlign.center,
          ),
          if (onRetry != null) ...[
            const SizedBox(height: 24),
            AppButton(
              label: 'Try again',
              onPressed: onRetry,
              variant: AppButtonVariant.primary,
              width: 160,
              height: 46,
              leadingIcon: const Icon(
                Icons.refresh_rounded,
                size: 18,
                color: AppColors.white,
              ),
            ),
          ],
        ],
      ),
    );

    if (fullScreen) {
      return Scaffold(
        body: Center(child: content),
      );
    }

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Center(child: content),
    );
  }
}
