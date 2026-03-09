import 'package:json_annotation/json_annotation.dart';

part 'favorite_model.g.dart';

double? _toDouble(dynamic value) {
  if (value == null) return null;
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value);
  return null;
}

@JsonSerializable()
class FavoriteModel {
  @JsonKey(name: 'is_favorited')
  final bool isFavorited;

  const FavoriteModel({required this.isFavorited});

  factory FavoriteModel.fromJson(Map<String, dynamic> json) =>
      _$FavoriteModelFromJson(json);

  Map<String, dynamic> toJson() => _$FavoriteModelToJson(this);
}

@JsonSerializable()
class FavoriteMerchantModel {
  final int id;
  final String name;
  final String slug;
  final Map<String, dynamic>? logo;
  @JsonKey(name: 'average_rating', fromJson: _toDouble)
  final double? averageRating;
  @JsonKey(name: 'review_count')
  final int? reviewCount;
  final Map<String, dynamic>? address;

  const FavoriteMerchantModel({
    required this.id,
    required this.name,
    required this.slug,
    this.logo,
    this.averageRating,
    this.reviewCount,
    this.address,
  });

  String? get logoUrl => (logo?['url'] as String?) ?? (logo?['thumb'] as String?);

  factory FavoriteMerchantModel.fromJson(Map<String, dynamic> json) =>
      _$FavoriteMerchantModelFromJson(json);

  Map<String, dynamic> toJson() => _$FavoriteMerchantModelToJson(this);
}
