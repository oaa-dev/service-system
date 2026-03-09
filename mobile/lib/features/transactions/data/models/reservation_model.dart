import 'package:json_annotation/json_annotation.dart';

part 'reservation_model.g.dart';

@JsonSerializable()
class ReservationModel {
  final int id;
  @JsonKey(name: 'check_in')
  final String checkIn;
  @JsonKey(name: 'check_out')
  final String checkOut;
  @JsonKey(name: 'guest_count')
  final int guestCount;
  final int nights;
  @JsonKey(name: 'price_per_night')
  final String pricePerNight;
  @JsonKey(name: 'total_price')
  final String totalPrice;
  @JsonKey(name: 'fee_amount')
  final String feeAmount;
  @JsonKey(name: 'total_amount')
  final String totalAmount;
  @JsonKey(name: 'discount_amount')
  final String discountAmount;
  final String status;
  @JsonKey(name: 'payment_status')
  final String paymentStatus;
  final String? notes;
  @JsonKey(name: 'special_requests')
  final String? specialRequests;
  @JsonKey(name: 'confirmed_at')
  final String? confirmedAt;
  @JsonKey(name: 'cancelled_at')
  final String? cancelledAt;
  @JsonKey(name: 'created_at')
  final String? createdAt;
  final Map<String, dynamic>? merchant;
  final Map<String, dynamic>? service;
  final Map<String, dynamic>? unit;

  const ReservationModel({
    required this.id,
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
    this.merchant,
    this.service,
    this.unit,
  });

  factory ReservationModel.fromJson(Map<String, dynamic> json) =>
      _$ReservationModelFromJson(json);

  Map<String, dynamic> toJson() => _$ReservationModelToJson(this);

  String? get merchantName => merchant?['name'] as String?;

  String? get merchantLogo {
    final logo = merchant?['logo'];
    if (logo is Map) return (logo['thumb'] ?? logo['url']) as String?;
    return null;
  }

  String? get serviceName => service?['name'] as String?;

  String? get unitName => unit?['name'] as String?;
}
