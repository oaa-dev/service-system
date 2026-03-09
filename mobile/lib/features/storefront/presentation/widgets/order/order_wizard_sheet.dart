import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../../../config/router.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../domain/entities/service_entity.dart';
import '../../bloc/order_form/order_form_bloc.dart';
import '../../bloc/order_form/order_form_event.dart';
import '../../bloc/order_form/order_form_state.dart';
import '../booking/booking_success.dart';
import '../booking/service_selector.dart';
import '../booking/step_indicator.dart';
import 'order_confirm_step.dart';

class OrderWizardSheet extends StatelessWidget {
  final List<ServiceEntity> services;
  final String merchantSlug;

  const OrderWizardSheet({
    super.key,
    required this.services,
    required this.merchantSlug,
  });

  @override
  Widget build(BuildContext context) {
    return BlocListener<OrderFormBloc, OrderFormState>(
      listener: (context, state) {
        if (state.error != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.error!),
              backgroundColor: AppColors.error,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          );
        }
      },
      child: BlocBuilder<OrderFormBloc, OrderFormState>(
        builder: (context, state) {
          if (state.isSuccess) {
            return BookingSuccess(
              title: 'Order Placed!',
              message:
                  'Your order has been placed successfully. Track its progress in your transactions.',
              ctaLabel: 'View My Orders',
              onCtaTap: () {
                Navigator.pop(context);
                context.push(AppRoutes.transactions);
              },
              onDismiss: () => Navigator.pop(context),
            );
          }
          return _buildWizard(context, state);
        },
      ),
    );
  }

  Widget _buildWizard(BuildContext context, OrderFormState state) {
    return Column(
      children: [
        // Drag handle
        Center(
          child: Container(
            margin: const EdgeInsets.only(top: 12, bottom: 4),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.grey300,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
        ),
        // Header
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            children: [
              if (state.step > 1)
                IconButton(
                  onPressed: () => context
                      .read<OrderFormBloc>()
                      .add(const GoBackOrderStepEvent()),
                  icon: const Icon(Icons.arrow_back_rounded, size: 22),
                  style: IconButton.styleFrom(
                    backgroundColor: AppColors.grey100,
                    padding: const EdgeInsets.all(8),
                  ),
                )
              else
                const SizedBox(width: 40),
              Expanded(
                child: Text(
                  'Place an Order',
                  style: AppTypography.titleMedium.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.close_rounded, size: 22),
                style: IconButton.styleFrom(
                  backgroundColor: AppColors.grey100,
                  padding: const EdgeInsets.all(8),
                ),
              ),
            ],
          ),
        ),
        StepIndicator(
          currentStep: state.step,
          totalSteps: 2,
          labels: const ['Product', 'Confirm'],
        ),
        Expanded(
          child: SingleChildScrollView(
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 250),
              child: _buildStep(context, state),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildStep(BuildContext context, OrderFormState state) {
    switch (state.step) {
      case 1:
        return ServiceSelector(
          key: const ValueKey('order_step_1'),
          services: services.where((s) => s.isSellable).toList(),
          selectedService: state.selectedProduct,
          onSelect: (product) => context
              .read<OrderFormBloc>()
              .add(SelectProductEvent(product)),
          emptyMessage: 'No products available',
        );
      case 2:
        return OrderConfirmStep(
          key: const ValueKey('order_step_2'),
          product: state.selectedProduct!,
          quantity: state.quantity,
          unitLabel: state.unitLabel,
          notes: state.notes,
          isSubmitting: state.isSubmitting,
          onQuantityChanged: (qty) =>
              context.read<OrderFormBloc>().add(SetQuantityEvent(qty)),
          onUnitLabelChanged: (label) =>
              context.read<OrderFormBloc>().add(SetUnitLabelEvent(label)),
          onNotesChanged: (notes) =>
              context.read<OrderFormBloc>().add(SetOrderNotesEvent(notes)),
          onSubmit: () =>
              context.read<OrderFormBloc>().add(const SubmitOrderEvent()),
        );
      default:
        return const SizedBox.shrink();
    }
  }
}
