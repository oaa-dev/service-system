import 'package:equatable/equatable.dart';

class MerchantAddress extends Equatable {
  final String? street;
  final String? city;
  final String? province;
  final String? region;
  final String? barangay;
  final double? latitude;
  final double? longitude;

  const MerchantAddress({
    this.street,
    this.city,
    this.province,
    this.region,
    this.barangay,
    this.latitude,
    this.longitude,
  });

  @override
  List<Object?> get props => [street, city, province, region, barangay, latitude, longitude];
}

class BusinessHoursEntity extends Equatable {
  final int dayOfWeek;
  final bool isOpen;
  final String? openTime;
  final String? closeTime;

  const BusinessHoursEntity({
    required this.dayOfWeek,
    required this.isOpen,
    this.openTime,
    this.closeTime,
  });

  @override
  List<Object?> get props => [dayOfWeek, isOpen, openTime, closeTime];
}

class MerchantEntity extends Equatable {
  final int id;
  final String name;
  final String slug;
  final String type;
  final String? status;
  final String? logoUrl;
  final String? logoThumb;
  final String? description;
  final double? averageRating;
  final int? reviewCount;
  final int? childrenCount;
  final int? parentId;
  final bool? isFavorited;
  final bool canSellProducts;
  final bool canTakeBookings;
  final bool canRentUnits;
  final double? distance;
  final MerchantAddress? address;
  final List<BusinessHoursEntity>? businessHours;

  const MerchantEntity({
    required this.id,
    required this.name,
    required this.slug,
    required this.type,
    this.status,
    this.logoUrl,
    this.logoThumb,
    this.description,
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

  bool get isOrganization => type == 'organization';

  @override
  List<Object?> get props => [
        id, name, slug, type, status, logoUrl, logoThumb, description,
        averageRating, reviewCount, childrenCount, parentId, isFavorited,
        canSellProducts, canTakeBookings, canRentUnits, distance,
        address, businessHours,
      ];
}
