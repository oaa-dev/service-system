// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'advertisement_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

AdvertisementModel _$AdvertisementModelFromJson(Map<String, dynamic> json) =>
    AdvertisementModel(
      id: (json['id'] as num).toInt(),
      title: json['title'] as String,
      description: json['description'] as String?,
      imageUrl: json['image_url'] as String?,
      linkUrl: json['link_url'] as String?,
      merchantId: (json['merchant_id'] as num?)?.toInt(),
      merchantSlug: json['merchant_slug'] as String?,
      position: json['position'] as String? ?? 'banner',
    );

Map<String, dynamic> _$AdvertisementModelToJson(AdvertisementModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'title': instance.title,
      'description': instance.description,
      'image_url': instance.imageUrl,
      'link_url': instance.linkUrl,
      'merchant_id': instance.merchantId,
      'merchant_slug': instance.merchantSlug,
      'position': instance.position,
    };
