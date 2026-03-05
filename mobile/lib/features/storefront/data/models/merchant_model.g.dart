// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'merchant_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

GeoReferenceModel _$GeoReferenceModelFromJson(Map<String, dynamic> json) =>
    GeoReferenceModel(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String,
    );

Map<String, dynamic> _$GeoReferenceModelToJson(GeoReferenceModel instance) =>
    <String, dynamic>{'id': instance.id, 'name': instance.name};

AddressModel _$AddressModelFromJson(Map<String, dynamic> json) => AddressModel(
  street: json['street'] as String?,
  postalCode: json['postal_code'] as String?,
  city: json['city'],
  province: json['province'],
  region: json['region'],
  barangay: json['barangay'],
  latitude: (json['latitude'] as num?)?.toDouble(),
  longitude: (json['longitude'] as num?)?.toDouble(),
);

Map<String, dynamic> _$AddressModelToJson(AddressModel instance) =>
    <String, dynamic>{
      'street': instance.street,
      'postal_code': instance.postalCode,
      'city': instance.city,
      'province': instance.province,
      'region': instance.region,
      'barangay': instance.barangay,
      'latitude': instance.latitude,
      'longitude': instance.longitude,
    };

LogoModel _$LogoModelFromJson(Map<String, dynamic> json) => LogoModel(
  url: json['url'] as String,
  thumb: json['thumb'] as String?,
  preview: json['preview'] as String?,
);

Map<String, dynamic> _$LogoModelToJson(LogoModel instance) => <String, dynamic>{
  'url': instance.url,
  'thumb': instance.thumb,
  'preview': instance.preview,
};

MerchantModel _$MerchantModelFromJson(Map<String, dynamic> json) =>
    MerchantModel(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String,
      slug: json['slug'] as String,
      type: json['type'] as String,
      status: json['status'] as String?,
      description: json['description'] as String?,
      logo: json['logo'] == null
          ? null
          : LogoModel.fromJson(json['logo'] as Map<String, dynamic>),
      averageRating: (json['average_rating'] as num?)?.toDouble(),
      reviewCount: (json['review_count'] as num?)?.toInt(),
      childrenCount: (json['children_count'] as num?)?.toInt(),
      parentId: (json['parent_id'] as num?)?.toInt(),
      isFavorited: json['is_favorited'] as bool?,
      canSellProducts: json['can_sell_products'] as bool? ?? false,
      canTakeBookings: json['can_take_bookings'] as bool? ?? false,
      canRentUnits: json['can_rent_units'] as bool? ?? false,
      distance: (json['distance'] as num?)?.toDouble(),
      address: json['address'] == null
          ? null
          : AddressModel.fromJson(json['address'] as Map<String, dynamic>),
      businessHours: (json['business_hours'] as List<dynamic>?)
          ?.map((e) => BusinessHoursModel.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$MerchantModelToJson(MerchantModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'slug': instance.slug,
      'type': instance.type,
      'status': instance.status,
      'description': instance.description,
      'logo': instance.logo,
      'average_rating': instance.averageRating,
      'review_count': instance.reviewCount,
      'children_count': instance.childrenCount,
      'parent_id': instance.parentId,
      'is_favorited': instance.isFavorited,
      'can_sell_products': instance.canSellProducts,
      'can_take_bookings': instance.canTakeBookings,
      'can_rent_units': instance.canRentUnits,
      'distance': instance.distance,
      'address': instance.address,
      'business_hours': instance.businessHours,
    };
