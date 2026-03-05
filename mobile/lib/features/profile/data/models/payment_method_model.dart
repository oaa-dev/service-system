import 'package:json_annotation/json_annotation.dart';

part 'payment_method_model.g.dart';

@JsonSerializable()
class PaymentMethodModel {
  final int id;
  final String name;
  final String slug;
  @JsonKey(name: 'is_active')
  final bool isActive;

  const PaymentMethodModel({
    required this.id,
    required this.name,
    required this.slug,
    required this.isActive,
  });

  factory PaymentMethodModel.fromJson(Map<String, dynamic> json) =>
      _$PaymentMethodModelFromJson(json);

  Map<String, dynamic> toJson() => _$PaymentMethodModelToJson(this);
}
