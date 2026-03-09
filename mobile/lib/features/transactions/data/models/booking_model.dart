import 'package:json_annotation/json_annotation.dart';

part 'booking_model.g.dart';

@JsonSerializable()
class BookingModel {
  final int id;
  @JsonKey(name: 'booking_date')
  final String bookingDate;
  @JsonKey(name: 'start_time')
  final String startTime;
  @JsonKey(name: 'end_time')
  final String endTime;
  @JsonKey(name: 'party_size')
  final int partySize;
  @JsonKey(name: 'service_price')
  final String servicePrice;
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
  @JsonKey(name: 'confirmed_at')
  final String? confirmedAt;
  @JsonKey(name: 'cancelled_at')
  final String? cancelledAt;
  @JsonKey(name: 'created_at')
  final String? createdAt;
  final Map<String, dynamic>? merchant;
  final Map<String, dynamic>? service;

  const BookingModel({
    required this.id,
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
    this.merchant,
    this.service,
  });

  factory BookingModel.fromJson(Map<String, dynamic> json) =>
      _$BookingModelFromJson(json);

  Map<String, dynamic> toJson() => _$BookingModelToJson(this);

  String? get merchantName => merchant?['name'] as String?;

  String? get merchantLogo {
    final logo = merchant?['logo'];
    if (logo is Map) return (logo['thumb'] ?? logo['url']) as String?;
    return null;
  }

  String? get serviceName => service?['name'] as String?;
}
