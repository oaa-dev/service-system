// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'service_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ServiceModel _$ServiceModelFromJson(Map<String, dynamic> json) => ServiceModel(
  id: (json['id'] as num).toInt(),
  name: json['name'] as String,
  slug: json['slug'] as String,
  description: json['description'] as String?,
  price: json['price'] as String,
  isActive: json['is_active'] as bool? ?? true,
  serviceType: json['service_type'] as String?,
  duration: (json['duration'] as num?)?.toInt(),
  image: json['image'] as Map<String, dynamic>?,
);

Map<String, dynamic> _$ServiceModelToJson(ServiceModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'slug': instance.slug,
      'description': instance.description,
      'price': instance.price,
      'is_active': instance.isActive,
      'service_type': instance.serviceType,
      'duration': instance.duration,
      'image': instance.image,
    };
