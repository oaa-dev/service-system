// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'favorite_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

FavoriteModel _$FavoriteModelFromJson(Map<String, dynamic> json) =>
    FavoriteModel(isFavorited: json['is_favorited'] as bool);

Map<String, dynamic> _$FavoriteModelToJson(FavoriteModel instance) =>
    <String, dynamic>{'is_favorited': instance.isFavorited};

FavoriteMerchantModel _$FavoriteMerchantModelFromJson(
  Map<String, dynamic> json,
) => FavoriteMerchantModel(
  id: (json['id'] as num).toInt(),
  name: json['name'] as String,
  slug: json['slug'] as String,
  logo: json['logo'] as Map<String, dynamic>?,
  averageRating: (json['average_rating'] as num?)?.toDouble(),
  reviewCount: (json['review_count'] as num?)?.toInt(),
  address: json['address'] as Map<String, dynamic>?,
);

Map<String, dynamic> _$FavoriteMerchantModelToJson(
  FavoriteMerchantModel instance,
) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'slug': instance.slug,
  'logo': instance.logo,
  'average_rating': instance.averageRating,
  'review_count': instance.reviewCount,
  'address': instance.address,
};
