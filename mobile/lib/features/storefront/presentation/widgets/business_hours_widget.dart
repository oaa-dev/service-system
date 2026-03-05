import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../domain/entities/merchant_entity.dart';

class BusinessHoursWidget extends StatelessWidget {
  final List<BusinessHoursEntity> businessHours;

  const BusinessHoursWidget({super.key, required this.businessHours});

  static const List<String> _dayNames = [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
  ];

  @override
  Widget build(BuildContext context) {
    final today = DateTime.now().weekday % 7; // Convert to 0=Sun...6=Sat
    final sorted = List<BusinessHoursEntity>.from(businessHours)
      ..sort((a, b) => a.dayOfWeek.compareTo(b.dayOfWeek));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (int i = 0; i < sorted.length; i++) ...[
          _buildRow(sorted[i], sorted[i].dayOfWeek == today),
          if (i < sorted.length - 1)
            Divider(
              height: 1,
              thickness: 0.5,
              color: AppColors.grey200,
              indent: 12,
              endIndent: 12,
            ),
        ],
      ],
    );
  }

  Widget _buildRow(BusinessHoursEntity hours, bool isToday) {
    // Determine live open/closed status for today
    final bool? isOpenNow = isToday ? _isCurrentlyOpen(hours) : null;

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
      decoration: isToday
          ? BoxDecoration(
              color: AppColors.primaryLight,
              borderRadius: BorderRadius.circular(8),
            )
          : null,
      child: Row(
        children: [
          SizedBox(
            width: 36,
            child: Text(
              _dayNames[hours.dayOfWeek],
              style: AppTypography.labelMedium.copyWith(
                color: isToday ? AppColors.primary : AppColors.grey600,
                fontWeight: isToday ? FontWeight.w700 : FontWeight.w500,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: hours.isOpen
                ? Text(
                    '${hours.openTime ?? ''} - ${hours.closeTime ?? ''}',
                    style: AppTypography.bodySmall.copyWith(
                      color: isToday ? AppColors.primary : AppColors.grey700,
                    ),
                  )
                : Text(
                    'Closed',
                    style: AppTypography.bodySmall.copyWith(
                      color: AppColors.grey400,
                    ),
                  ),
          ),
          // Live status badge for today
          if (isToday && isOpenNow != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: isOpenNow
                    ? AppColors.success.withAlpha(20)
                    : AppColors.error.withAlpha(20),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 6,
                    height: 6,
                    decoration: BoxDecoration(
                      color: isOpenNow ? AppColors.success : AppColors.error,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    isOpenNow ? 'Open now' : 'Closed',
                    style: AppTypography.labelSmall.copyWith(
                      color: isOpenNow ? AppColors.success : AppColors.error,
                      fontWeight: FontWeight.w600,
                      fontSize: 10,
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  /// Parse HH:MM time and check if current time falls within open/close range.
  bool? _isCurrentlyOpen(BusinessHoursEntity hours) {
    if (!hours.isOpen) return false;
    if (hours.openTime == null || hours.closeTime == null) return null;

    final now = TimeOfDay.now();
    final open = _parseTime(hours.openTime!);
    final close = _parseTime(hours.closeTime!);
    if (open == null || close == null) return null;

    final nowMinutes = now.hour * 60 + now.minute;
    final openMinutes = open.hour * 60 + open.minute;
    final closeMinutes = close.hour * 60 + close.minute;

    return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
  }

  TimeOfDay? _parseTime(String time) {
    final parts = time.split(':');
    if (parts.length < 2) return null;
    final hour = int.tryParse(parts[0]);
    final minute = int.tryParse(parts[1]);
    if (hour == null || minute == null) return null;
    return TimeOfDay(hour: hour, minute: minute);
  }
}
