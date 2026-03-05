// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'review_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ReviewCustomerModel _$ReviewCustomerModelFromJson(Map<String, dynamic> json) =>
    ReviewCustomerModel(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String?,
      avatar: json['avatar'] as String?,
    );

Map<String, dynamic> _$ReviewCustomerModelToJson(
  ReviewCustomerModel instance,
) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'avatar': instance.avatar,
};

ReviewMerchantModel _$ReviewMerchantModelFromJson(Map<String, dynamic> json) =>
    ReviewMerchantModel(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String,
      slug: json['slug'] as String,
      logoUrl: json['logo_url'] as String?,
    );

Map<String, dynamic> _$ReviewMerchantModelToJson(
  ReviewMerchantModel instance,
) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'slug': instance.slug,
  'logo_url': instance.logoUrl,
};

ReviewModel _$ReviewModelFromJson(Map<String, dynamic> json) => ReviewModel(
  id: (json['id'] as num).toInt(),
  rating: (json['rating'] as num).toInt(),
  title: json['title'] as String?,
  comment: json['comment'] as String?,
  isVerified: json['is_verified'] as bool,
  isPublished: json['is_published'] as bool,
  merchantReply: json['merchant_reply'] as String?,
  merchantRepliedAt: json['merchant_replied_at'] as String?,
  createdAt: json['created_at'] as String,
  customer: json['customer'] == null
      ? null
      : ReviewCustomerModel.fromJson(json['customer'] as Map<String, dynamic>),
  merchant: json['merchant'] == null
      ? null
      : ReviewMerchantModel.fromJson(json['merchant'] as Map<String, dynamic>),
);

Map<String, dynamic> _$ReviewModelToJson(ReviewModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'rating': instance.rating,
      'title': instance.title,
      'comment': instance.comment,
      'is_verified': instance.isVerified,
      'is_published': instance.isPublished,
      'merchant_reply': instance.merchantReply,
      'merchant_replied_at': instance.merchantRepliedAt,
      'created_at': instance.createdAt,
      'customer': instance.customer,
      'merchant': instance.merchant,
    };
