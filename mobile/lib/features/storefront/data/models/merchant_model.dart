import 'package:json_annotation/json_annotation.dart';
import 'business_hours_model.dart';

part 'merchant_model.g.dart';

@JsonSerializable()
class GeoReferenceModel {
  final int id;
  final String name;

  const GeoReferenceModel({required this.id, required this.name});

  factory GeoReferenceModel.fromJson(Map<String, dynamic> json) =>
      _$GeoReferenceModelFromJson(json);

  Map<String, dynamic> toJson() => _$GeoReferenceModelToJson(this);
}

@JsonSerializable()
class AddressModel {
  final String? street;
  @JsonKey(name: 'postal_code')
  final String? postalCode;
  final dynamic city;
  final dynamic province;
  final dynamic region;
  final dynamic barangay;
  final double? latitude;
  final double? longitude;

  const AddressModel({
    this.street,
    this.postalCode,
    this.city,
    this.province,
    this.region,
    this.barangay,
    this.latitude,
    this.longitude,
  });

  factory AddressModel.fromJson(Map<String, dynamic> json) =>
      _$AddressModelFromJson(json);

  Map<String, dynamic> toJson() => _$AddressModelToJson(this);

  String? get cityName => city is Map ? (city as Map)['name'] as String? : city as String?;
  String? get provinceName => province is Map ? (province as Map)['name'] as String? : province as String?;
  String? get regionName => region is Map ? (region as Map)['name'] as String? : region as String?;
  String? get barangayName => barangay is Map ? (barangay as Map)['name'] as String? : barangay as String?;
}

@JsonSerializable()
class LogoModel {
  final String url;
  final String? thumb;
  final String? preview;

  const LogoModel({required this.url, this.thumb, this.preview});

  factory LogoModel.fromJson(Map<String, dynamic> json) =>
      _$LogoModelFromJson(json);

  Map<String, dynamic> toJson() => _$LogoModelToJson(this);
}

double? _toDouble(dynamic value) {
  if (value == null) return null;
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value);
  return null;
}

@JsonSerializable()
class MerchantModel {
  final int id;
  final String name;
  final String slug;
  final String type;
  final String? status;
  final String? description;
  final LogoModel? logo;
  @JsonKey(name: 'average_rating', fromJson: _toDouble)
  final double? averageRating;
  @JsonKey(name: 'review_count')
  final int? reviewCount;
  @JsonKey(name: 'children_count')
  final int? childrenCount;
  @JsonKey(name: 'parent_id')
  final int? parentId;
  @JsonKey(name: 'is_favorited')
  final bool? isFavorited;
  @JsonKey(name: 'can_sell_products')
  final bool canSellProducts;
  @JsonKey(name: 'can_take_bookings')
  final bool canTakeBookings;
  @JsonKey(name: 'can_rent_units')
  final bool canRentUnits;
  final double? distance;
  final AddressModel? address;
  @JsonKey(name: 'business_hours')
  final List<BusinessHoursModel>? businessHours;

  const MerchantModel({
    required this.id,
    required this.name,
    required this.slug,
    required this.type,
    this.status,
    this.description,
    this.logo,
    this.averageRating,
    this.reviewCount,
    this.childrenCount,
    this.parentId,
    this.isFavorited,
    this.canSellProducts = false,
    this.canTakeBookings = false,
    this.canRentUnits = false,
    this.distance,
    this.address,
    this.businessHours,
  });

  String? get logoUrl => logo?.url;
  String? get logoThumb => logo?.thumb;

  factory MerchantModel.fromJson(Map<String, dynamic> json) =>
      _$MerchantModelFromJson(json);

  Map<String, dynamic> toJson() => _$MerchantModelToJson(this);
}
