import 'package:flutter/material.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../domain/entities/service_entity.dart';

class OrderConfirmStep extends StatelessWidget {
  final ServiceEntity product;
  final double quantity;
  final String unitLabel;
  final String notes;
  final bool isSubmitting;
  final ValueChanged<double> onQuantityChanged;
  final ValueChanged<String> onUnitLabelChanged;
  final ValueChanged<String> onNotesChanged;
  final VoidCallback onSubmit;

  const OrderConfirmStep({
    super.key,
    required this.product,
    required this.quantity,
    required this.unitLabel,
    required this.notes,
    required this.isSubmitting,
    required this.onQuantityChanged,
    required this.onUnitLabelChanged,
    required this.onNotesChanged,
    required this.onSubmit,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Confirm Order',
            style: AppTypography.titleMedium.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 20),
          // Product summary
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
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: AppColors.successLight,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.shopping_bag_rounded,
                      size: 22, color: AppColors.success),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(product.name,
                          style: AppTypography.titleSmall
                              .copyWith(fontWeight: FontWeight.w700)),
                      const SizedBox(height: 2),
                      Text('\u20B1${product.price} per unit',
                          style: AppTypography.bodySmall
                              .copyWith(color: AppColors.grey500)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // Quantity
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.grey200),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Quantity',
                              style: AppTypography.titleSmall),
                          Text(
                            '${quantity.toStringAsFixed(quantity == quantity.roundToDouble() ? 0 : 2)} $unitLabel',
                            style: AppTypography.bodySmall
                                .copyWith(color: AppColors.grey500),
                          ),
                        ],
                      ),
                    ),
                    _buildStepper(),
                  ],
                ),
                const SizedBox(height: 12),
                // Unit label
                TextField(
                  controller: TextEditingController(text: unitLabel)
                    ..selection = TextSelection.fromPosition(
                        TextPosition(offset: unitLabel.length)),
                  onChanged: onUnitLabelChanged,
                  decoration: InputDecoration(
                    labelText: 'Unit',
                    hintText: 'e.g., pcs, kg, liters',
                    isDense: true,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: AppColors.grey200),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: AppColors.grey200),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide:
                          const BorderSide(color: AppColors.primary, width: 1.5),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // Price
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
                    Text('Unit Price',
                        style: AppTypography.bodyMedium
                            .copyWith(color: AppColors.grey600)),
                    Text('\u20B1${product.price}',
                        style: AppTypography.bodyMedium
                            .copyWith(fontWeight: FontWeight.w600)),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Quantity',
                        style: AppTypography.bodyMedium
                            .copyWith(color: AppColors.grey600)),
                    Text(
                        '\u00D7 ${quantity.toStringAsFixed(quantity == quantity.roundToDouble() ? 0 : 2)}',
                        style: AppTypography.bodyMedium
                            .copyWith(fontWeight: FontWeight.w600)),
                  ],
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: Divider(color: AppColors.primary.withAlpha(30)),
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Estimated Total',
                        style: AppTypography.titleSmall
                            .copyWith(fontWeight: FontWeight.w700)),
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
            maxLines: 3,
            maxLength: 1000,
            decoration: InputDecoration(
              labelText: 'Notes (optional)',
              hintText: 'Any special instructions...',
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
                      'Place Order',
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
      final price = double.parse(product.price);
      return '\u20B1${(price * quantity).toStringAsFixed(2)}';
    } catch (_) {
      return '\u20B1${product.price}';
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
          _stepperBtn(Icons.remove_rounded,
              quantity > 1 ? () => onQuantityChanged(quantity - 1) : null),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            child: Text(
              quantity.toStringAsFixed(
                  quantity == quantity.roundToDouble() ? 0 : 2),
              style: AppTypography.titleSmall
                  .copyWith(fontWeight: FontWeight.w700),
            ),
          ),
          _stepperBtn(
              Icons.add_rounded, () => onQuantityChanged(quantity + 1)),
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
}
