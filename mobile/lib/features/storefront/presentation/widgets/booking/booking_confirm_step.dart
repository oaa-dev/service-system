import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../domain/entities/booking_availability_entity.dart';
import '../../../domain/entities/service_entity.dart';

class BookingConfirmStep extends StatelessWidget {
  final ServiceEntity service;
  final DateTime date;
  final BookingSlotEntity? slot;
  final String? customStartTime;
  final int partySize;
  final String notes;
  final bool isSubmitting;
  final ValueChanged<String> onNotesChanged;
  final VoidCallback onSubmit;

  const BookingConfirmStep({
    super.key,
    required this.service,
    required this.date,
    this.slot,
    this.customStartTime,
    required this.partySize,
    required this.notes,
    required this.isSubmitting,
    required this.onNotesChanged,
    required this.onSubmit,
  });

  @override
  Widget build(BuildContext context) {
    final timeDisplay = slot != null
        ? '${slot!.startTime}${slot!.endTime != null ? ' - ${slot!.endTime}' : ''}'
        : customStartTime ?? 'Not selected';

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Confirm Booking',
            style: AppTypography.titleMedium.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Review your booking details',
            style: AppTypography.bodySmall.copyWith(
              color: AppColors.grey500,
            ),
          ),
          const SizedBox(height: 20),
          // Summary card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.grey200),
            ),
            child: Column(
              children: [
                _buildInfoRow(
                  Icons.spa_outlined,
                  'Service',
                  service.name,
                ),
                _divider(),
                _buildInfoRow(
                  Icons.calendar_today_rounded,
                  'Date',
                  DateFormat('EEEE, MMMM d, y').format(date),
                ),
                _divider(),
                _buildInfoRow(
                  Icons.access_time_rounded,
                  'Time',
                  timeDisplay,
                ),
                _divider(),
                _buildInfoRow(
                  Icons.people_rounded,
                  'Party Size',
                  '$partySize ${partySize == 1 ? 'person' : 'people'}',
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // Price section
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.primaryLight,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.primary.withAlpha(30)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Service Price',
                  style: AppTypography.titleSmall.copyWith(
                    color: AppColors.grey700,
                  ),
                ),
                Text(
                  '\u20B1${service.price}',
                  style: AppTypography.titleLarge.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // Notes field
          TextField(
            onChanged: onNotesChanged,
            maxLines: 3,
            maxLength: 1000,
            decoration: InputDecoration(
              labelText: 'Notes (optional)',
              hintText: 'Any special requests or additional information...',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppColors.grey200),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppColors.grey200),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide:
                    const BorderSide(color: AppColors.primary, width: 1.5),
              ),
              filled: true,
              fillColor: AppColors.white,
              counterText: '',
            ),
          ),
          const SizedBox(height: 24),
          // Submit button
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: isSubmitting ? null : onSubmit,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: AppColors.white,
                disabledBackgroundColor: AppColors.primary.withAlpha(150),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                elevation: 0,
              ),
              child: isSubmitting
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.5,
                        valueColor:
                            AlwaysStoppedAnimation(AppColors.white),
                      ),
                    )
                  : Text(
                      'Confirm Booking',
                      style: AppTypography.labelLarge.copyWith(
                        color: AppColors.white,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppColors.grey400),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: AppTypography.labelSmall.copyWith(
                    color: AppColors.grey400,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: AppTypography.bodyMedium.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _divider() {
    return Divider(height: 1, color: AppColors.grey100);
  }
}
