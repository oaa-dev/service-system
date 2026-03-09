import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../../../config/router.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../domain/entities/service_entity.dart';
import '../../bloc/reservation_form/reservation_form_bloc.dart';
import '../../bloc/reservation_form/reservation_form_event.dart';
import '../../bloc/reservation_form/reservation_form_state.dart';
import '../booking/booking_success.dart';
import '../booking/service_selector.dart';
import '../booking/step_indicator.dart';
import 'date_range_picker_step.dart';
import 'reservation_confirm_step.dart';

class ReservationWizardSheet extends StatelessWidget {
  final List<ServiceEntity> services;
  final String merchantSlug;

  const ReservationWizardSheet({
    super.key,
    required this.services,
    required this.merchantSlug,
  });

  @override
  Widget build(BuildContext context) {
    return BlocListener<ReservationFormBloc, ReservationFormState>(
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
      child: BlocBuilder<ReservationFormBloc, ReservationFormState>(
        builder: (context, state) {
          if (state.isSuccess) {
            return BookingSuccess(
              title: 'Reservation Submitted!',
              message:
                  'Your reservation has been submitted. You\'ll receive a confirmation soon.',
              ctaLabel: 'View My Reservations',
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

  Widget _buildWizard(BuildContext context, ReservationFormState state) {
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
                      .read<ReservationFormBloc>()
                      .add(const GoBackReservationStepEvent()),
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
                  'Make a Reservation',
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
          totalSteps: 3,
          labels: const ['Unit', 'Dates', 'Confirm'],
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

  Widget _buildStep(BuildContext context, ReservationFormState state) {
    switch (state.step) {
      case 1:
        return ServiceSelector(
          key: const ValueKey('res_step_1'),
          services: services,
          selectedService: state.selectedService,
          onSelect: (service) => context
              .read<ReservationFormBloc>()
              .add(SelectReservationServiceEvent(service)),
          emptyMessage: 'No unit types available',
        );
      case 2:
        return DateRangePickerStep(
          key: const ValueKey('res_step_2'),
          checkIn: state.checkIn,
          checkOut: state.checkOut,
          onCheckInSelected: (date) => context
              .read<ReservationFormBloc>()
              .add(SelectCheckInEvent(date)),
          onCheckOutSelected: (date) => context
              .read<ReservationFormBloc>()
              .add(SelectCheckOutEvent(date)),
        );
      case 3:
        return ReservationConfirmStep(
          key: const ValueKey('res_step_3'),
          service: state.selectedService!,
          checkIn: state.checkIn!,
          checkOut: state.checkOut!,
          guestCount: state.guestCount,
          notes: state.notes,
          specialRequests: state.specialRequests,
          isSubmitting: state.isSubmitting,
          onGuestCountChanged: (count) => context
              .read<ReservationFormBloc>()
              .add(SetGuestCountEvent(count)),
          onNotesChanged: (notes) => context
              .read<ReservationFormBloc>()
              .add(SetReservationNotesEvent(notes)),
          onSpecialRequestsChanged: (req) => context
              .read<ReservationFormBloc>()
              .add(SetSpecialRequestsEvent(req)),
          onSubmit: () => context
              .read<ReservationFormBloc>()
              .add(const SubmitReservationEvent()),
        );
      default:
        return const SizedBox.shrink();
    }
  }
}
