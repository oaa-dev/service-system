// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'customer_profile_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

CustomerProfileModel _$CustomerProfileModelFromJson(
  Map<String, dynamic> json,
) => CustomerProfileModel(
  id: (json['id'] as num).toInt(),
  firstName: json['first_name'] as String,
  lastName: json['last_name'] as String,
  name: json['name'] as String,
  email: json['email'] as String,
  emailVerifiedAt: json['email_verified_at'] as String?,
  roles:
      (json['roles'] as List<dynamic>?)?.map((e) => e as String).toList() ??
      const [],
  profile: json['profile'] == null
      ? null
      : UserProfileModel.fromJson(json['profile'] as Map<String, dynamic>),
  customer: json['customer'] == null
      ? null
      : CustomerDataModel.fromJson(json['customer'] as Map<String, dynamic>),
);

Map<String, dynamic> _$CustomerProfileModelToJson(
  CustomerProfileModel instance,
) => <String, dynamic>{
  'id': instance.id,
  'first_name': instance.firstName,
  'last_name': instance.lastName,
  'name': instance.name,
  'email': instance.email,
  'email_verified_at': instance.emailVerifiedAt,
  'roles': instance.roles,
  'profile': instance.profile,
  'customer': instance.customer,
};

UserProfileModel _$UserProfileModelFromJson(Map<String, dynamic> json) =>
    UserProfileModel(
      phone: json['phone'] as String?,
      bio: json['bio'] as String?,
      avatarUrl: json['avatar_url'] as String?,
      identityStatus: json['identity_status'] as String?,
    );

Map<String, dynamic> _$UserProfileModelToJson(UserProfileModel instance) =>
    <String, dynamic>{
      'phone': instance.phone,
      'bio': instance.bio,
      'avatar_url': instance.avatarUrl,
      'identity_status': instance.identityStatus,
    };

CustomerDataModel _$CustomerDataModelFromJson(Map<String, dynamic> json) =>
    CustomerDataModel(
      id: (json['id'] as num).toInt(),
      preferredPaymentMethodId: (json['preferred_payment_method_id'] as num?)
          ?.toInt(),
    );

Map<String, dynamic> _$CustomerDataModelToJson(CustomerDataModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'preferred_payment_method_id': instance.preferredPaymentMethodId,
    };
