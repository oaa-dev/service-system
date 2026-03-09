// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'booking_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

BookingModel _$BookingModelFromJson(Map<String, dynamic> json) => BookingModel(
  id: (json['id'] as num).toInt(),
  bookingDate: json['booking_date'] as String,
  startTime: json['start_time'] as String,
  endTime: json['end_time'] as String,
  partySize: (json['party_size'] as num).toInt(),
  servicePrice: json['service_price'] as String,
  feeAmount: json['fee_amount'] as String,
  totalAmount: json['total_amount'] as String,
  discountAmount: json['discount_amount'] as String,
  status: json['status'] as String,
  paymentStatus: json['payment_status'] as String,
  notes: json['notes'] as String?,
  confirmedAt: json['confirmed_at'] as String?,
  cancelledAt: json['cancelled_at'] as String?,
  createdAt: json['created_at'] as String?,
  merchant: json['merchant'] as Map<String, dynamic>?,
  service: json['service'] as Map<String, dynamic>?,
);

Map<String, dynamic> _$BookingModelToJson(BookingModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'booking_date': instance.bookingDate,
      'start_time': instance.startTime,
      'end_time': instance.endTime,
      'party_size': instance.partySize,
      'service_price': instance.servicePrice,
      'fee_amount': instance.feeAmount,
      'total_amount': instance.totalAmount,
      'discount_amount': instance.discountAmount,
      'status': instance.status,
      'payment_status': instance.paymentStatus,
      'notes': instance.notes,
      'confirmed_at': instance.confirmedAt,
      'cancelled_at': instance.cancelledAt,
      'created_at': instance.createdAt,
      'merchant': instance.merchant,
      'service': instance.service,
    };
