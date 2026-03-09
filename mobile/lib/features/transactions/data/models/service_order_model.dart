import 'package:json_annotation/json_annotation.dart';

part 'service_order_model.g.dart';

@JsonSerializable()
class ServiceOrderModel {
  final int id;
  @JsonKey(name: 'order_number')
  final String orderNumber;
  final String quantity;
  @JsonKey(name: 'unit_label')
  final String unitLabel;
  @JsonKey(name: 'unit_price')
  final String unitPrice;
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
  @JsonKey(name: 'estimated_completion')
  final String? estimatedCompletion;
  @JsonKey(name: 'completed_at')
  final String? completedAt;
  @JsonKey(name: 'cancelled_at')
  final String? cancelledAt;
  @JsonKey(name: 'created_at')
  final String? createdAt;
  final Map<String, dynamic>? merchant;
  final Map<String, dynamic>? service;

  const ServiceOrderModel({
    required this.id,
    required this.orderNumber,
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
    this.merchant,
    this.service,
  });

  factory ServiceOrderModel.fromJson(Map<String, dynamic> json) =>
      _$ServiceOrderModelFromJson(json);

  Map<String, dynamic> toJson() => _$ServiceOrderModelToJson(this);

  String? get merchantName => merchant?['name'] as String?;

  String? get merchantLogo {
    final logo = merchant?['logo'];
    if (logo is Map) return (logo['thumb'] ?? logo['url']) as String?;
    return null;
  }

  String? get serviceName => service?['name'] as String?;
}
