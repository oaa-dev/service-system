// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'reservation_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ReservationModel _$ReservationModelFromJson(Map<String, dynamic> json) =>
    ReservationModel(
      id: (json['id'] as num).toInt(),
      checkIn: json['check_in'] as String,
      checkOut: json['check_out'] as String,
      guestCount: (json['guest_count'] as num).toInt(),
      nights: (json['nights'] as num).toInt(),
      pricePerNight: json['price_per_night'] as String,
      totalPrice: json['total_price'] as String,
      feeAmount: json['fee_amount'] as String,
      totalAmount: json['total_amount'] as String,
      discountAmount: json['discount_amount'] as String,
      status: json['status'] as String,
      paymentStatus: json['payment_status'] as String,
      notes: json['notes'] as String?,
      specialRequests: json['special_requests'] as String?,
      confirmedAt: json['confirmed_at'] as String?,
      cancelledAt: json['cancelled_at'] as String?,
      createdAt: json['created_at'] as String?,
      merchant: json['merchant'] as Map<String, dynamic>?,
      service: json['service'] as Map<String, dynamic>?,
      unit: json['unit'] as Map<String, dynamic>?,
    );

Map<String, dynamic> _$ReservationModelToJson(ReservationModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'check_in': instance.checkIn,
      'check_out': instance.checkOut,
      'guest_count': instance.guestCount,
      'nights': instance.nights,
      'price_per_night': instance.pricePerNight,
      'total_price': instance.totalPrice,
      'fee_amount': instance.feeAmount,
      'total_amount': instance.totalAmount,
      'discount_amount': instance.discountAmount,
      'status': instance.status,
      'payment_status': instance.paymentStatus,
      'notes': instance.notes,
      'special_requests': instance.specialRequests,
      'confirmed_at': instance.confirmedAt,
      'cancelled_at': instance.cancelledAt,
      'created_at': instance.createdAt,
      'merchant': instance.merchant,
      'service': instance.service,
      'unit': instance.unit,
    };
