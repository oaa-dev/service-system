import 'package:equatable/equatable.dart';

sealed class WriteReviewEvent extends Equatable {
  const WriteReviewEvent();

  @override
  List<Object?> get props => [];
}

class SubmitReviewEvent extends WriteReviewEvent {
  final int merchantId;
  final int rating;
  final String? title;
  final String? comment;

  const SubmitReviewEvent({
    required this.merchantId,
    required this.rating,
    this.title,
    this.comment,
  });

  @override
  List<Object?> get props => [merchantId, rating, title, comment];
}

class UpdateReviewSubmitEvent extends WriteReviewEvent {
  final int reviewId;
  final int rating;
  final String? title;
  final String? comment;

  const UpdateReviewSubmitEvent({
    required this.reviewId,
    required this.rating,
    this.title,
    this.comment,
  });

  @override
  List<Object?> get props => [reviewId, rating, title, comment];
}
