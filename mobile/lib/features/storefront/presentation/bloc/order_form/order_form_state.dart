import 'package:equatable/equatable.dart';
import '../../../domain/entities/service_entity.dart';

class OrderFormState extends Equatable {
  final int step;
  final List<ServiceEntity> services;
  final String merchantSlug;
  final ServiceEntity? selectedProduct;
  final double quantity;
  final String unitLabel;
  final String notes;
  final bool isSubmitting;
  final String? error;
  final bool isSuccess;
  final Map<String, dynamic>? createdOrder;

  const OrderFormState({
    this.step = 1,
    this.services = const [],
    this.merchantSlug = '',
    this.selectedProduct,
    this.quantity = 1.0,
    this.unitLabel = 'pcs',
    this.notes = '',
    this.isSubmitting = false,
    this.error,
    this.isSuccess = false,
    this.createdOrder,
  });

  OrderFormState copyWith({
    int? step,
    List<ServiceEntity>? services,
    String? merchantSlug,
    ServiceEntity? selectedProduct,
    double? quantity,
    String? unitLabel,
    String? notes,
    bool? isSubmitting,
    String? error,
    bool? isSuccess,
    Map<String, dynamic>? createdOrder,
    bool clearError = false,
  }) {
    return OrderFormState(
      step: step ?? this.step,
      services: services ?? this.services,
      merchantSlug: merchantSlug ?? this.merchantSlug,
      selectedProduct: selectedProduct ?? this.selectedProduct,
      quantity: quantity ?? this.quantity,
      unitLabel: unitLabel ?? this.unitLabel,
      notes: notes ?? this.notes,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      error: clearError ? null : (error ?? this.error),
      isSuccess: isSuccess ?? this.isSuccess,
      createdOrder: createdOrder ?? this.createdOrder,
    );
  }

  @override
  List<Object?> get props => [
        step,
        services,
        merchantSlug,
        selectedProduct,
        quantity,
        unitLabel,
        notes,
        isSubmitting,
        error,
        isSuccess,
        createdOrder,
      ];
}
