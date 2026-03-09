import 'package:json_annotation/json_annotation.dart';

part 'advertisement_model.g.dart';

@JsonSerializable()
class AdvertisementModel {
  final int id;
  final String title;
  final String? description;
  @JsonKey(name: 'image_url')
  final String? imageUrl;
  @JsonKey(name: 'link_url')
  final String? linkUrl;
  @JsonKey(name: 'merchant_id')
  final int? merchantId;
  @JsonKey(name: 'merchant_slug')
  final String? merchantSlug;
  final String position;

  const AdvertisementModel({
    required this.id,
    required this.title,
    this.description,
    this.imageUrl,
    this.linkUrl,
    this.merchantId,
    this.merchantSlug,
    this.position = 'banner',
  });

  factory AdvertisementModel.fromJson(Map<String, dynamic> json) =>
      _$AdvertisementModelFromJson(json);

  Map<String, dynamic> toJson() => _$AdvertisementModelToJson(this);
}
