import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../messaging/presentation/widgets/chat_bottom_sheet.dart';
import '../../domain/entities/reservation_entity.dart';
import 'status_chip.dart';

class ReservationDetailSheet extends StatelessWidget {
  final ReservationEntity reservation;
  final VoidCallback? onCancel;
  final int currentUserId;

  const ReservationDetailSheet({super.key, required this.reservation, this.onCancel, required this.currentUserId});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(24, 12, 24, 32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.grey300, borderRadius: BorderRadius.circular(2)))),
            const SizedBox(height: 20),
            Text('Reservation Details', style: AppTypography.titleLarge),
            const SizedBox(height: 20),
            _buildMerchantRow(),
            const SizedBox(height: 24),
            _buildInfoSection(),
            const SizedBox(height: 20),
            if (reservation.specialRequests != null && reservation.specialRequests!.isNotEmpty) ...[
              Text('Special Requests', style: AppTypography.labelMedium),
              const SizedBox(height: 4),
              Text(reservation.specialRequests!, style: AppTypography.bodyMedium),
              const SizedBox(height: 20),
            ],
            if (reservation.notes != null && reservation.notes!.isNotEmpty) ...[
              Text('Notes', style: AppTypography.labelMedium),
              const SizedBox(height: 4),
              Text(reservation.notes!, style: AppTypography.bodyMedium),
              const SizedBox(height: 20),
            ],
            _buildPriceSection(),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () => _openChat(context),
                icon: const Icon(Icons.chat_bubble_outline_rounded, size: 18),
                label: const Text('Message Merchant'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.primary,
                  side: const BorderSide(color: AppColors.primary),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
            const SizedBox(height: 8),
            if (reservation.status == 'pending' && onCancel != null)
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () => _showCancelDialog(context),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.error,
                    side: const BorderSide(color: AppColors.error),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Cancel Reservation'),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildMerchantRow() {
    return Row(
      children: [
        Container(
          width: 48, height: 48,
          decoration: BoxDecoration(color: AppColors.primaryLight, borderRadius: BorderRadius.circular(12)),
          child: reservation.merchantLogo != null
              ? ClipRRect(borderRadius: BorderRadius.circular(12),
                  child: Image.network(reservation.merchantLogo!, fit: BoxFit.cover,
                      errorBuilder: (_, e, s) => const Icon(Icons.hotel_rounded, color: AppColors.primary, size: 24)))
              : const Icon(Icons.hotel_rounded, color: AppColors.primary, size: 24),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(reservation.merchantName ?? 'Reservation', style: AppTypography.titleMedium),
            if (reservation.unitName != null) Text(reservation.unitName!, style: AppTypography.bodySmall),
          ]),
        ),
        StatusChip(status: reservation.status),
      ],
    );
  }

  Widget _buildInfoSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12)),
      child: Column(children: [
        _infoRow(Icons.login_rounded, 'Check-in', _formatDate(reservation.checkIn)),
        const SizedBox(height: 12),
        _infoRow(Icons.logout_rounded, 'Check-out', _formatDate(reservation.checkOut)),
        const SizedBox(height: 12),
        _infoRow(Icons.nights_stay_rounded, 'Nights', '${reservation.nights}'),
        const SizedBox(height: 12),
        _infoRow(Icons.group_rounded, 'Guests', '${reservation.guestCount}'),
        if (reservation.serviceName != null) ...[const SizedBox(height: 12), _infoRow(Icons.bed_rounded, 'Unit Type', reservation.serviceName!)],
        const SizedBox(height: 12),
        _infoRow(Icons.info_outline_rounded, 'Payment', _formatStatus(reservation.paymentStatus)),
      ]),
    );
  }

  Widget _buildPriceSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12)),
      child: Column(children: [
        _priceRow('Price/Night', '₱${reservation.pricePerNight}'),
        const SizedBox(height: 8),
        _priceRow('${reservation.nights} night${reservation.nights == 1 ? "" : "s"}', '₱${reservation.totalPrice}'),
        const SizedBox(height: 8),
        _priceRow('Platform Fee', '₱${reservation.feeAmount}'),
        if (reservation.discountAmount != '0.00') ...[const SizedBox(height: 8), _priceRow('Discount', '-₱${reservation.discountAmount}', valueColor: AppColors.success)],
        const Padding(padding: EdgeInsets.symmetric(vertical: 8), child: Divider(height: 1, color: AppColors.grey200)),
        _priceRow('Total', '₱${reservation.totalAmount}', isTotal: true),
      ]),
    );
  }

  Widget _infoRow(IconData icon, String label, String value) => Row(children: [
    Icon(icon, size: 18, color: AppColors.grey400), const SizedBox(width: 10),
    Text(label, style: AppTypography.bodyMedium.copyWith(color: AppColors.grey500)),
    const Spacer(), Flexible(child: Text(value, style: AppTypography.titleSmall, textAlign: TextAlign.end)),
  ]);

  Widget _priceRow(String label, String value, {bool isTotal = false, Color? valueColor}) => Row(
    mainAxisAlignment: MainAxisAlignment.spaceBetween,
    children: [
      Text(label, style: isTotal ? AppTypography.titleSmall : AppTypography.bodyMedium.copyWith(color: AppColors.grey500)),
      Text(value, style: isTotal ? AppTypography.titleMedium.copyWith(color: AppColors.primary) : AppTypography.bodyMedium.copyWith(color: valueColor)),
    ],
  );

  String _formatDate(String date) { try { return DateFormat('MMM d, yyyy').format(DateTime.parse(date)); } catch (_) { return date; } }
  String _formatStatus(String s) => s.split('_').map((w) => w.isEmpty ? '' : '${w[0].toUpperCase()}${w.substring(1)}').join(' ');

  void _openChat(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => ChatBottomSheet(
        type: 'reservations',
        entityId: reservation.id,
        currentUserId: currentUserId,
      ),
    );
  }

  void _showCancelDialog(BuildContext context) {
    showDialog<void>(context: context, builder: (_) => AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: const Text('Cancel Reservation?'),
      content: const Text('Are you sure? This action cannot be undone.'),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: Text('Keep', style: TextStyle(color: AppColors.grey500))),
        TextButton(onPressed: () { Navigator.pop(context); Navigator.pop(context); onCancel?.call(); },
          child: const Text('Cancel Reservation', style: TextStyle(color: AppColors.error))),
      ],
    ));
  }
}
