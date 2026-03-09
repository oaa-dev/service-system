import 'package:equatable/equatable.dart';

class ServiceOrderEntity extends Equatable {
  final int id;
  final String orderNumber;
  final String? merchantName;
  final String? merchantLogo;
  final String? serviceName;
  final String quantity;
  final String unitLabel;
  final String unitPrice;
  final String totalPrice;
  final String feeAmount;
  final String totalAmount;
  final String discountAmount;
  final String status;
  final String paymentStatus;
  final String? notes;
  final String? estimatedCompletion;
  final String? completedAt;
  final String? cancelledAt;
  final String? createdAt;

  const ServiceOrderEntity({
    required this.id,
    required this.orderNumber,
    this.merchantName,
    this.merchantLogo,
    this.serviceName,
    required this.quantity,
    required this.unitLabel,
    required this.unitPrice,
    required this.totalPrice,
    required this.feeAmount,
    required this.totalAmount,
    required this.discountAmount,
    required this.status,
    required this.paymentStatus,
    this.notes,
    this.estimatedCompletion,
    this.completedAt,
    this.cancelledAt,
    this.createdAt,
  });

  @override
  List<Object?> get props => [
        id, orderNumber, merchantName, merchantLogo, serviceName,
        quantity, unitLabel, unitPrice, totalPrice,
        feeAmount, totalAmount, discountAmount,
        status, paymentStatus, notes,
        estimatedCompletion, completedAt, cancelledAt, createdAt,
      ];
}
