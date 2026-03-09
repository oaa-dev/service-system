// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'service_order_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ServiceOrderModel _$ServiceOrderModelFromJson(Map<String, dynamic> json) =>
    ServiceOrderModel(
      id: (json['id'] as num).toInt(),
      orderNumber: json['order_number'] as String,
      quantity: json['quantity'] as String,
      unitLabel: json['unit_label'] as String,
      unitPrice: json['unit_price'] as String,
      totalPrice: json['total_price'] as String,
      feeAmount: json['fee_amount'] as String,
      totalAmount: json['total_amount'] as String,
      discountAmount: json['discount_amount'] as String,
      status: json['status'] as String,
      paymentStatus: json['payment_status'] as String,
      notes: json['notes'] as String?,
      estimatedCompletion: json['estimated_completion'] as String?,
      completedAt: json['completed_at'] as String?,
      cancelledAt: json['cancelled_at'] as String?,
      createdAt: json['created_at'] as String?,
      merchant: json['merchant'] as Map<String, dynamic>?,
      service: json['service'] as Map<String, dynamic>?,
    );

Map<String, dynamic> _$ServiceOrderModelToJson(ServiceOrderModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'order_number': instance.orderNumber,
      'quantity': instance.quantity,
      'unit_label': instance.unitLabel,
      'unit_price': instance.unitPrice,
      'total_price': instance.totalPrice,
      'fee_amount': instance.feeAmount,
      'total_amount': instance.totalAmount,
      'discount_amount': instance.discountAmount,
      'status': instance.status,
      'payment_status': instance.paymentStatus,
      'notes': instance.notes,
      'estimated_completion': instance.estimatedCompletion,
      'completed_at': instance.completedAt,
      'cancelled_at': instance.cancelledAt,
      'created_at': instance.createdAt,
      'merchant': instance.merchant,
      'service': instance.service,
    };
