import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../domain/entities/service_entity.dart';

class ReservationConfirmStep extends StatelessWidget {
  final ServiceEntity service;
  final DateTime checkIn;
  final DateTime checkOut;
  final int guestCount;
  final String notes;
  final String specialRequests;
  final bool isSubmitting;
  final ValueChanged<int> onGuestCountChanged;
  final ValueChanged<String> onNotesChanged;
  final ValueChanged<String> onSpecialRequestsChanged;
  final VoidCallback onSubmit;

  const ReservationConfirmStep({
    super.key,
    required this.service,
    required this.checkIn,
    required this.checkOut,
    required this.guestCount,
    required this.notes,
    required this.specialRequests,
    required this.isSubmitting,
    required this.onGuestCountChanged,
    required this.onNotesChanged,
    required this.onSpecialRequestsChanged,
    required this.onSubmit,
  });

  int get nights => checkOut.difference(checkIn).inDays;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Confirm Reservation',
            style: AppTypography.titleMedium.copyWith(
              fontWeight: FontWeight.w700,
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
                _buildInfoRow(Icons.house_rounded, 'Unit Type', service.name),
                _divider(),
                _buildInfoRow(Icons.login_rounded, 'Check-in',
                    DateFormat('EEE, MMM d, y').format(checkIn)),
                _divider(),
                _buildInfoRow(Icons.logout_rounded, 'Check-out',
                    DateFormat('EEE, MMM d, y').format(checkOut)),
                _divider(),
                _buildInfoRow(Icons.nights_stay_rounded, 'Duration',
                    '$nights ${nights == 1 ? 'night' : 'nights'}'),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // Guest count
          Container(
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
                    color: AppColors.secondaryLight,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.people_rounded,
                      size: 20, color: AppColors.secondary),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Guests', style: AppTypography.titleSmall),
                      Text(
                        '$guestCount ${guestCount == 1 ? 'guest' : 'guests'}',
                        style: AppTypography.bodySmall.copyWith(
                          color: AppColors.grey500,
                        ),
                      ),
                    ],
                  ),
                ),
                _buildStepper(),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // Price breakdown
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.primaryLight,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.primary.withAlpha(30)),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Price per night',
                      style: AppTypography.bodyMedium.copyWith(
                        color: AppColors.grey600,
                      ),
                    ),
                    Text(
                      '\u20B1${service.price}',
                      style: AppTypography.bodyMedium.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '$nights ${nights == 1 ? 'night' : 'nights'}',
                      style: AppTypography.bodyMedium.copyWith(
                        color: AppColors.grey600,
                      ),
                    ),
                    Text(
                      '\u00D7 $nights',
                      style: AppTypography.bodyMedium.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: Divider(color: AppColors.primary.withAlpha(30)),
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Estimated Total',
                      style: AppTypography.titleSmall.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Text(
                      _estimatedTotal(),
                      style: AppTypography.titleLarge.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // Notes
          TextField(
            onChanged: onNotesChanged,
            maxLines: 2,
            maxLength: 1000,
            decoration: _inputDecor('Notes (optional)', 'Any additional notes...'),
          ),
          const SizedBox(height: 12),
          TextField(
            onChanged: onSpecialRequestsChanged,
            maxLines: 2,
            maxLength: 2000,
            decoration: _inputDecor(
                'Special Requests (optional)', 'Early check-in, extra towels...'),
          ),
          const SizedBox(height: 24),
          // Submit
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
                        valueColor: AlwaysStoppedAnimation(AppColors.white),
                      ),
                    )
                  : Text(
                      'Confirm Reservation',
                      style: AppTypography.labelLarge.copyWith(
                        color: AppColors.white,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  String _estimatedTotal() {
    try {
      final pricePerNight = double.parse(service.price);
      final total = pricePerNight * nights;
      return '\u20B1${total.toStringAsFixed(2)}';
    } catch (_) {
      return '\u20B1${service.price}';
    }
  }

  Widget _buildStepper() {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.grey50,
        borderRadius: BorderRadius.circular(25),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _stepperBtn(
            Icons.remove_rounded,
            guestCount > 1 ? () => onGuestCountChanged(guestCount - 1) : null,
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            child: Text(
              '$guestCount',
              style: AppTypography.titleSmall.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          _stepperBtn(
            Icons.add_rounded,
            () => onGuestCountChanged(guestCount + 1),
          ),
        ],
      ),
    );
  }

  Widget _stepperBtn(IconData icon, VoidCallback? onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: onTap != null ? AppColors.white : Colors.transparent,
          shape: BoxShape.circle,
        ),
        child: Icon(icon,
            size: 18,
            color: onTap != null ? AppColors.grey800 : AppColors.grey300),
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
                Text(label,
                    style: AppTypography.labelSmall
                        .copyWith(color: AppColors.grey400)),
                const SizedBox(height: 2),
                Text(value,
                    style: AppTypography.bodyMedium
                        .copyWith(fontWeight: FontWeight.w600)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _divider() => Divider(height: 1, color: AppColors.grey100);

  InputDecoration _inputDecor(String label, String hint) {
    return InputDecoration(
      labelText: label,
      hintText: hint,
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
        borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
      ),
      filled: true,
      fillColor: AppColors.white,
      counterText: '',
    );
  }
}
