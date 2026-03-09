import 'package:equatable/equatable.dart';

class ReservationEntity extends Equatable {
  final int id;
  final String? merchantName;
  final String? merchantLogo;
  final String? serviceName;
  final String? unitName;
  final String checkIn;
  final String checkOut;
  final int guestCount;
  final int nights;
  final String pricePerNight;
  final String totalPrice;
  final String feeAmount;
  final String totalAmount;
  final String discountAmount;
  final String status;
  final String paymentStatus;
  final String? notes;
  final String? specialRequests;
  final String? confirmedAt;
  final String? cancelledAt;
  final String? createdAt;

  const ReservationEntity({
    required this.id,
    this.merchantName,
    this.merchantLogo,
    this.serviceName,
    this.unitName,
    required this.checkIn,
    required this.checkOut,
    required this.guestCount,
    required this.nights,
    required this.pricePerNight,
    required this.totalPrice,
    required this.feeAmount,
    required this.totalAmount,
    required this.discountAmount,
    required this.status,
    required this.paymentStatus,
    this.notes,
    this.specialRequests,
    this.confirmedAt,
    this.cancelledAt,
    this.createdAt,
  });

  @override
  List<Object?> get props => [
        id, merchantName, merchantLogo, serviceName, unitName,
        checkIn, checkOut, guestCount, nights,
        pricePerNight, totalPrice, feeAmount, totalAmount, discountAmount,
        status, paymentStatus, notes, specialRequests,
        confirmedAt, cancelledAt, createdAt,
      ];
}
