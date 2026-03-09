import 'package:flutter/material.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../domain/entities/booking_availability_entity.dart';

class SlotPickerStep extends StatelessWidget {
  final BookingAvailabilityEntity? availability;
  final bool isLoading;
  final BookingSlotEntity? selectedSlot;
  final String? customStartTime;
  final int partySize;
  final ValueChanged<BookingSlotEntity> onSlotSelected;
  final ValueChanged<String> onCustomTimeSet;
  final ValueChanged<int> onPartySizeChanged;

  const SlotPickerStep({
    super.key,
    this.availability,
    this.isLoading = false,
    this.selectedSlot,
    this.customStartTime,
    required this.partySize,
    required this.onSlotSelected,
    required this.onCustomTimeSet,
    required this.onPartySizeChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Pick a Time',
            style: AppTypography.titleMedium.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Choose your preferred time slot',
            style: AppTypography.bodySmall.copyWith(
              color: AppColors.grey500,
            ),
          ),
          const SizedBox(height: 20),
          if (isLoading) _buildLoadingState(),
          if (!isLoading && availability != null) ...[
            if (availability!.hasSlots)
              _buildSlotGrid()
            else
              _buildCustomTimePicker(context),
            const SizedBox(height: 24),
          ],
          _buildPartySizeSelector(),
        ],
      ),
    );
  }

  Widget _buildLoadingState() {
    return Container(
      height: 120,
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(14),
      ),
      child: const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 28,
              height: 28,
              child: CircularProgressIndicator(
                strokeWidth: 2.5,
                valueColor: AlwaysStoppedAnimation(AppColors.primary),
              ),
            ),
            SizedBox(height: 10),
            Text('Loading available slots...'),
          ],
        ),
      ),
    );
  }

  Widget _buildSlotGrid() {
    final slots = availability!.slots;
    if (slots.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: AppColors.warningLight,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Row(
          children: [
            const Icon(Icons.info_outline_rounded,
                size: 20, color: AppColors.warning),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                'No available time slots for this date. Please try another date.',
                style: AppTypography.bodySmall.copyWith(
                  color: AppColors.grey700,
                ),
              ),
            ),
          ],
        ),
      );
    }

    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: slots.map((slot) {
        final isSelected = selectedSlot?.slotId == slot.slotId &&
            selectedSlot?.startTime == slot.startTime;
        final isDisabled = slot.isFull;

        return GestureDetector(
          onTap: isDisabled ? null : () => onSlotSelected(slot),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: isDisabled
                  ? AppColors.grey100
                  : isSelected
                      ? AppColors.primary
                      : AppColors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isDisabled
                    ? AppColors.grey200
                    : isSelected
                        ? AppColors.primary
                        : AppColors.grey200,
                width: isSelected ? 2 : 1,
              ),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  slot.startTime,
                  style: AppTypography.titleSmall.copyWith(
                    fontWeight: FontWeight.w700,
                    color: isDisabled
                        ? AppColors.grey300
                        : isSelected
                            ? AppColors.white
                            : AppColors.grey800,
                  ),
                ),
                if (slot.endTime != null) ...[
                  Text(
                    '- ${slot.endTime}',
                    style: AppTypography.bodySmall.copyWith(
                      color: isDisabled
                          ? AppColors.grey300
                          : isSelected
                              ? AppColors.white.withAlpha(180)
                              : AppColors.grey500,
                    ),
                  ),
                ],
                if (slot.available != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    isDisabled ? 'Full' : '${slot.available} left',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: isDisabled
                          ? AppColors.error
                          : isSelected
                              ? AppColors.white.withAlpha(200)
                              : slot.available! <= 2
                                  ? AppColors.warning
                                  : AppColors.success,
                    ),
                  ),
                ],
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildCustomTimePicker(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.grey200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Preferred Start Time',
            style: AppTypography.labelMedium.copyWith(
              color: AppColors.grey600,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 10),
          GestureDetector(
            onTap: () async {
              final picked = await showTimePicker(
                context: context,
                initialTime: customStartTime != null
                    ? _parseTime(customStartTime!)
                    : const TimeOfDay(hour: 9, minute: 0),
                builder: (context, child) {
                  return Theme(
                    data: Theme.of(context).copyWith(
                      colorScheme: Theme.of(context).colorScheme.copyWith(
                            primary: AppColors.primary,
                          ),
                    ),
                    child: child!,
                  );
                },
              );
              if (picked != null) {
                final formatted =
                    '${picked.hour.toString().padLeft(2, '0')}:${picked.minute.toString().padLeft(2, '0')}';
                onCustomTimeSet(formatted);
              }
            },
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: customStartTime != null
                    ? AppColors.primaryLight
                    : AppColors.grey50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: customStartTime != null
                      ? AppColors.primary
                      : AppColors.grey200,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.access_time_rounded,
                    size: 20,
                    color: customStartTime != null
                        ? AppColors.primary
                        : AppColors.grey400,
                  ),
                  const SizedBox(width: 10),
                  Text(
                    customStartTime ?? 'Tap to select time',
                    style: AppTypography.bodyMedium.copyWith(
                      fontWeight: customStartTime != null
                          ? FontWeight.w600
                          : FontWeight.w400,
                      color: customStartTime != null
                          ? AppColors.primary
                          : AppColors.grey400,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPartySizeSelector() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.grey200),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.primaryLight,
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.people_rounded,
                size: 20, color: AppColors.primary),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Party Size',
                    style: AppTypography.titleSmall),
                Text(
                  '$partySize ${partySize == 1 ? 'person' : 'people'}',
                  style: AppTypography.bodySmall.copyWith(
                    color: AppColors.grey500,
                  ),
                ),
              ],
            ),
          ),
          Container(
            decoration: BoxDecoration(
              color: AppColors.grey50,
              borderRadius: BorderRadius.circular(25),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _stepperButton(
                  icon: Icons.remove_rounded,
                  onTap: partySize > 1
                      ? () => onPartySizeChanged(partySize - 1)
                      : null,
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  child: Text(
                    '$partySize',
                    style: AppTypography.titleSmall.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                _stepperButton(
                  icon: Icons.add_rounded,
                  onTap: () => onPartySizeChanged(partySize + 1),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _stepperButton({required IconData icon, VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: onTap != null ? AppColors.white : Colors.transparent,
          shape: BoxShape.circle,
          boxShadow: onTap != null
              ? [
                  BoxShadow(
                    color: AppColors.grey900.withAlpha(10),
                    blurRadius: 4,
                    offset: const Offset(0, 1),
                  ),
                ]
              : null,
        ),
        child: Icon(
          icon,
          size: 18,
          color: onTap != null ? AppColors.grey800 : AppColors.grey300,
        ),
      ),
    );
  }

  TimeOfDay _parseTime(String time) {
    final parts = time.split(':');
    return TimeOfDay(
      hour: int.parse(parts[0]),
      minute: int.parse(parts[1]),
    );
  }
}
