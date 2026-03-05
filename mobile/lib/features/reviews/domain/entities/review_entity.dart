import 'package:equatable/equatable.dart';

class ReviewCustomerEntity extends Equatable {
  final int id;
  final String? name;
  final String? avatarUrl;

  const ReviewCustomerEntity({
    required this.id,
    this.name,
    this.avatarUrl,
  });

  @override
  List<Object?> get props => [id, name, avatarUrl];
}

class ReviewMerchantEntity extends Equatable {
  final int id;
  final String name;
  final String slug;
  final String? logoUrl;

  const ReviewMerchantEntity({
    required this.id,
    required this.name,
    required this.slug,
    this.logoUrl,
  });

  @override
  List<Object?> get props => [id, name, slug, logoUrl];
}

class ReviewEntity extends Equatable {
  final int id;
  final int rating;
  final String? title;
  final String? comment;
  final bool isVerified;
  final bool isPublished;
  final String? merchantReply;
  final String? merchantRepliedAt;
  final String createdAt;
  final ReviewCustomerEntity? customer;
  final ReviewMerchantEntity? merchant;

  const ReviewEntity({
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

  @override
  List<Object?> get props => [
        id, rating, title, comment, isVerified, isPublished,
        merchantReply, merchantRepliedAt, createdAt, customer, merchant,
      ];
}
