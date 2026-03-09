import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../../../config/router.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../domain/entities/service_entity.dart';
import '../../bloc/booking_form/booking_form_bloc.dart';
import '../../bloc/booking_form/booking_form_event.dart';
import '../../bloc/booking_form/booking_form_state.dart';
import 'booking_confirm_step.dart';
import 'booking_success.dart';
import 'date_picker_step.dart';
import 'service_selector.dart';
import 'slot_picker_step.dart';
import 'step_indicator.dart';

class BookingWizardSheet extends StatelessWidget {
  final List<ServiceEntity> services;
  final String merchantSlug;

  const BookingWizardSheet({
    super.key,
    required this.services,
    required this.merchantSlug,
  });

  @override
  Widget build(BuildContext context) {
    return BlocListener<BookingFormBloc, BookingFormState>(
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
      child: BlocBuilder<BookingFormBloc, BookingFormState>(
        builder: (context, state) {
          if (state.isSuccess) {
            return _buildSuccessView(context);
          }
          return _buildWizardView(context, state);
        },
      ),
    );
  }

  Widget _buildSuccessView(BuildContext context) {
    return BookingSuccess(
      onCtaTap: () {
        Navigator.pop(context);
        context.push(AppRoutes.transactions);
      },
      onDismiss: () => Navigator.pop(context),
    );
  }

  Widget _buildWizardView(BuildContext context, BookingFormState state) {
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
                      .read<BookingFormBloc>()
                      .add(const GoBackStepEvent()),
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
                  'Book Appointment',
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
        // Step indicator
        StepIndicator(
          currentStep: state.step,
          totalSteps: 4,
          labels: const ['Service', 'Date', 'Time', 'Confirm'],
        ),
        // Content
        Expanded(
          child: SingleChildScrollView(
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 250),
              child: _buildStepContent(context, state),
            ),
          ),
        ),
        // Next button for steps 2 and 3
        if (state.step == 3 && _canAdvanceToConfirm(state))
          _buildNextButton(context, state),
      ],
    );
  }

  Widget _buildStepContent(BuildContext context, BookingFormState state) {
    switch (state.step) {
      case 1:
        return ServiceSelector(
          key: const ValueKey('step_1'),
          services: services.where((s) => s.isBookable).toList(),
          selectedService: state.selectedService,
          onSelect: (service) => context
              .read<BookingFormBloc>()
              .add(SelectServiceEvent(service)),
          emptyMessage: 'No bookable services available',
        );
      case 2:
        return DatePickerStep(
          key: const ValueKey('step_2'),
          selectedDate: state.selectedDate,
          onDateSelected: (date) => context
              .read<BookingFormBloc>()
              .add(SelectDateEvent(date)),
        );
      case 3:
        return SlotPickerStep(
          key: const ValueKey('step_3'),
          availability: state.availability,
          isLoading: state.isLoadingAvailability,
          selectedSlot: state.selectedSlot,
          customStartTime: state.selectedStartTime,
          partySize: state.partySize,
          onSlotSelected: (slot) => context
              .read<BookingFormBloc>()
              .add(SelectSlotEvent(slot)),
          onCustomTimeSet: (time) => context
              .read<BookingFormBloc>()
              .add(SetCustomTimeEvent(time)),
          onPartySizeChanged: (size) => context
              .read<BookingFormBloc>()
              .add(SetPartySizeEvent(size)),
        );
      case 4:
        return BookingConfirmStep(
          key: const ValueKey('step_4'),
          service: state.selectedService!,
          date: state.selectedDate!,
          slot: state.selectedSlot,
          customStartTime: state.selectedStartTime,
          partySize: state.partySize,
          notes: state.notes,
          isSubmitting: state.isSubmitting,
          onNotesChanged: (notes) => context
              .read<BookingFormBloc>()
              .add(SetNotesEvent(notes)),
          onSubmit: () => context
              .read<BookingFormBloc>()
              .add(const SubmitBookingEvent()),
        );
      default:
        return const SizedBox.shrink();
    }
  }

  bool _canAdvanceToConfirm(BookingFormState state) {
    return !state.isLoadingAvailability &&
        (state.selectedSlot != null || state.selectedStartTime != null);
  }

  Widget _buildNextButton(BuildContext context, BookingFormState state) {
    return Padding(
      padding: EdgeInsets.fromLTRB(
          20, 12, 20, MediaQuery.of(context).padding.bottom + 12),
      child: SizedBox(
        width: double.infinity,
        height: 50,
        child: ElevatedButton(
          onPressed: () {
            // Advance from step 3 to step 4 (confirm)
            context.read<BookingFormBloc>().add(const GoToConfirmStepEvent());
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: AppColors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
            elevation: 0,
          ),
          child: Text(
            'Continue to Confirm',
            style: AppTypography.labelLarge.copyWith(
              color: AppColors.white,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ),
    );
  }
}
