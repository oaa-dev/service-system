import 'package:flutter/material.dart';
import '../../../../../core/theme/app_colors.dart';

class StepIndicator extends StatelessWidget {
  final int currentStep;
  final int totalSteps;
  final List<String> labels;

  const StepIndicator({
    super.key,
    required this.currentStep,
    required this.totalSteps,
    required this.labels,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      child: Row(
        children: List.generate(totalSteps * 2 - 1, (index) {
          if (index.isOdd) {
            // Connector line
            final stepBefore = index ~/ 2 + 1;
            final isCompleted = stepBefore < currentStep;
            return Expanded(
              child: Container(
                height: 2,
                margin: const EdgeInsets.symmetric(horizontal: 4),
                decoration: BoxDecoration(
                  color: isCompleted ? AppColors.primary : AppColors.grey200,
                  borderRadius: BorderRadius.circular(1),
                ),
              ),
            );
          }

          final step = index ~/ 2 + 1;
          final isActive = step == currentStep;
          final isCompleted = step < currentStep;

          return Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                width: isActive ? 32 : 28,
                height: isActive ? 32 : 28,
                decoration: BoxDecoration(
                  color: isCompleted || isActive
                      ? AppColors.primary
                      : AppColors.grey100,
                  shape: BoxShape.circle,
                  border: isActive
                      ? Border.all(
                          color: AppColors.primary.withAlpha(50), width: 3)
                      : null,
                ),
                child: Center(
                  child: isCompleted
                      ? const Icon(Icons.check_rounded,
                          size: 16, color: AppColors.white)
                      : Text(
                          '$step',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: isActive
                                ? AppColors.white
                                : AppColors.grey400,
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                step <= labels.length ? labels[step - 1] : '',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
                  color: isActive || isCompleted
                      ? AppColors.primary
                      : AppColors.grey400,
                ),
              ),
            ],
          );
        }),
      ),
    );
  }
}
