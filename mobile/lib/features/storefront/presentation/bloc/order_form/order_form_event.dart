import 'package:equatable/equatable.dart';
import '../../../domain/entities/service_entity.dart';

sealed class OrderFormEvent extends Equatable {
  const OrderFormEvent();

  @override
  List<Object?> get props => [];
}

class InitOrderFormEvent extends OrderFormEvent {
  final List<ServiceEntity> services;
  final String merchantSlug;
  final int? preselectedServiceId;

  const InitOrderFormEvent({
    required this.services,
    required this.merchantSlug,
    this.preselectedServiceId,
  });

  @override
  List<Object?> get props => [services, merchantSlug, preselectedServiceId];
}

class SelectProductEvent extends OrderFormEvent {
  final ServiceEntity product;

  const SelectProductEvent(this.product);

  @override
  List<Object?> get props => [product];
}

class SetQuantityEvent extends OrderFormEvent {
  final double quantity;

  const SetQuantityEvent(this.quantity);

  @override
  List<Object?> get props => [quantity];
}

class SetUnitLabelEvent extends OrderFormEvent {
  final String unitLabel;

  const SetUnitLabelEvent(this.unitLabel);

  @override
  List<Object?> get props => [unitLabel];
}

class SetOrderNotesEvent extends OrderFormEvent {
  final String notes;

  const SetOrderNotesEvent(this.notes);

  @override
  List<Object?> get props => [notes];
}

class SubmitOrderEvent extends OrderFormEvent {
  const SubmitOrderEvent();
}

class GoBackOrderStepEvent extends OrderFormEvent {
  const GoBackOrderStepEvent();
}

class ResetOrderFormEvent extends OrderFormEvent {
  const ResetOrderFormEvent();
}
