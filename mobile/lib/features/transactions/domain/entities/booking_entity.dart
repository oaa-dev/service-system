import 'package:equatable/equatable.dart';

class BookingEntity extends Equatable {
  final int id;
  final String? merchantName;
  final String? merchantLogo;
  final String? serviceName;
  final String bookingDate;
  final String startTime;
  final String endTime;
  final int partySize;
  final String servicePrice;
  final String feeAmount;
  final String totalAmount;
  final String discountAmount;
  final String status;
  final String paymentStatus;
  final String? notes;
  final String? confirmedAt;
  final String? cancelledAt;
  final String? createdAt;

  const BookingEntity({
    required this.id,
    this.merchantName,
    this.merchantLogo,
    this.serviceName,
    required this.bookingDate,
    required this.startTime,
    required this.endTime,
    required this.partySize,
    required this.servicePrice,
    required this.feeAmount,
    required this.totalAmount,
    required this.discountAmount,
    required this.status,
    required this.paymentStatus,
    this.notes,
    this.confirmedAt,
    this.cancelledAt,
    this.createdAt,
  });

  @override
  List<Object?> get props => [
        id, merchantName, merchantLogo, serviceName,
        bookingDate, startTime, endTime, partySize,
        servicePrice, feeAmount, totalAmount, discountAmount,
        status, paymentStatus, notes,
        confirmedAt, cancelledAt, createdAt,
      ];
}
