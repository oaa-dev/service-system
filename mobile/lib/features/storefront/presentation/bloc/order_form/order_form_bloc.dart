import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';
import '../../../domain/entities/service_entity.dart';
import '../../../domain/usecases/create_order_use_case.dart';
import 'order_form_event.dart';
import 'order_form_state.dart';

@injectable
class OrderFormBloc extends Bloc<OrderFormEvent, OrderFormState> {
  final CreateOrderUseCase _createOrder;

  OrderFormBloc(this._createOrder) : super(const OrderFormState()) {
    on<InitOrderFormEvent>(_onInit);
    on<SelectProductEvent>(_onSelectProduct);
    on<SetQuantityEvent>(_onSetQuantity);
    on<SetUnitLabelEvent>(_onSetUnitLabel);
    on<SetOrderNotesEvent>(_onSetNotes);
    on<SubmitOrderEvent>(_onSubmit);
    on<GoBackOrderStepEvent>(_onGoBack);
    on<ResetOrderFormEvent>(_onReset);
  }

  Future<void> _onInit(
    InitOrderFormEvent event,
    Emitter<OrderFormState> emit,
  ) async {
    ServiceEntity? preselected;
    if (event.preselectedServiceId != null) {
      preselected = event.services.where((s) => s.id == event.preselectedServiceId).firstOrNull;
    }
    emit(OrderFormState(
      step: preselected != null ? 2 : 1,
      services: event.services,
      merchantSlug: event.merchantSlug,
      selectedProduct: preselected,
    ));
  }

  Future<void> _onSelectProduct(
    SelectProductEvent event,
    Emitter<OrderFormState> emit,
  ) async {
    emit(state.copyWith(
      selectedProduct: event.product,
      step: 2,
      clearError: true,
    ));
  }

  Future<void> _onSetQuantity(
    SetQuantityEvent event,
    Emitter<OrderFormState> emit,
  ) async {
    emit(state.copyWith(quantity: event.quantity));
  }

  Future<void> _onSetUnitLabel(
    SetUnitLabelEvent event,
    Emitter<OrderFormState> emit,
  ) async {
    emit(state.copyWith(unitLabel: event.unitLabel));
  }

  Future<void> _onSetNotes(
    SetOrderNotesEvent event,
    Emitter<OrderFormState> emit,
  ) async {
    emit(state.copyWith(notes: event.notes));
  }

  Future<void> _onSubmit(
    SubmitOrderEvent event,
    Emitter<OrderFormState> emit,
  ) async {
    emit(state.copyWith(
      isSubmitting: true,
      clearError: true,
    ));

    final data = <String, dynamic>{
      'service_id': state.selectedProduct!.id,
      'quantity': state.quantity,
      'unit_label': state.unitLabel,
      if (state.notes.isNotEmpty) 'notes': state.notes,
    };

    final result = await _createOrder(
      slug: state.merchantSlug,
      data: data,
    );

    result.fold(
      (failure) => emit(state.copyWith(
        isSubmitting: false,
        error: failure.message,
      )),
      (order) => emit(state.copyWith(
        isSubmitting: false,
        isSuccess: true,
        createdOrder: order,
      )),
    );
  }

  Future<void> _onGoBack(
    GoBackOrderStepEvent event,
    Emitter<OrderFormState> emit,
  ) async {
    if (state.step > 1) {
      emit(state.copyWith(
        step: state.step - 1,
        clearError: true,
      ));
    }
  }

  Future<void> _onReset(
    ResetOrderFormEvent event,
    Emitter<OrderFormState> emit,
  ) async {
    emit(OrderFormState(
      step: 1,
      services: state.services,
      merchantSlug: state.merchantSlug,
    ));
  }
}
