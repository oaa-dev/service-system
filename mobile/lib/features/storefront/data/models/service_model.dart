import 'package:json_annotation/json_annotation.dart';

part 'service_model.g.dart';

@JsonSerializable()
class ServiceModel {
  final int id;
  final String name;
  final String slug;
  final String? description;
  final String price;
  @JsonKey(name: 'is_active')
  final bool isActive;
  @JsonKey(name: 'service_type')
  final String? serviceType;
  final int? duration;
  final Map<String, dynamic>? image;

  const ServiceModel({
    required this.id,
    required this.name,
    required this.slug,
    this.description,
    required this.price,
    this.isActive = true,
    this.serviceType,
    this.duration,
    this.image,
  });

  bool get isBookable => serviceType == 'bookable';
  bool get isSellable => serviceType == 'sellable';
  String? get imageUrl => (image?['url'] as String?) ?? (image?['thumb'] as String?);

  factory ServiceModel.fromJson(Map<String, dynamic> json) =>
      _$ServiceModelFromJson(json);

  Map<String, dynamic> toJson() => _$ServiceModelToJson(this);
}
