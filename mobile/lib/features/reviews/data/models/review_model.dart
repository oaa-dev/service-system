import 'package:json_annotation/json_annotation.dart';

part 'review_model.g.dart';

@JsonSerializable()
class ReviewCustomerModel {
  final int id;
  final String? name;
  final String? avatar;

  const ReviewCustomerModel({
    required this.id,
    this.name,
    this.avatar,
  });

  factory ReviewCustomerModel.fromJson(Map<String, dynamic> json) =>
      _$ReviewCustomerModelFromJson(json);

  Map<String, dynamic> toJson() => _$ReviewCustomerModelToJson(this);
}

@JsonSerializable()
class ReviewMerchantModel {
  final int id;
  final String name;
  final String slug;
  @JsonKey(name: 'logo_url')
  final String? logoUrl;

  const ReviewMerchantModel({
    required this.id,
    required this.name,
    required this.slug,
    this.logoUrl,
  });

  factory ReviewMerchantModel.fromJson(Map<String, dynamic> json) =>
      _$ReviewMerchantModelFromJson(json);

  Map<String, dynamic> toJson() => _$ReviewMerchantModelToJson(this);
}

@JsonSerializable()
class ReviewModel {
  final int id;
  final int rating;
  final String? title;
  final String? comment;
  @JsonKey(name: 'is_verified')
  final bool isVerified;
  @JsonKey(name: 'is_published')
  final bool isPublished;
  @JsonKey(name: 'merchant_reply')
  final String? merchantReply;
  @JsonKey(name: 'merchant_replied_at')
  final String? merchantRepliedAt;
  @JsonKey(name: 'created_at')
  final String createdAt;
  final ReviewCustomerModel? customer;
  final ReviewMerchantModel? merchant;

  const ReviewModel({
    required this.id,
    required this.rating,
    this.title,
    this.comment,
    required this.isVerified,
    required this.isPublished,
    this.merchantReply,
    this.merchantRepliedAt,
    required this.createdAt,
    this.customer,
    this.merchant,
  });

  factory ReviewModel.fromJson(Map<String, dynamic> json) =>
      _$ReviewModelFromJson(json);

  Map<String, dynamic> toJson() => _$ReviewModelToJson(this);
}
