import 'package:equatable/equatable.dart';

class FavoriteMerchantEntity extends Equatable {
  final int id;
  final String name;
  final String slug;
  final String? logoUrl;
  final double? averageRating;
  final int? reviewCount;
  final String? city;

  const FavoriteMerchantEntity({
    required this.id,
    required this.name,
    required this.slug,
    this.logoUrl,
    this.averageRating,
    this.reviewCount,
    this.city,
  });

  @override
  List<Object?> get props => [
        id,
        name,
        slug,
        logoUrl,
        averageRating,
        reviewCount,
        city,
      ];
}
