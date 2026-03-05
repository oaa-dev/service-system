import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';
import '../../../../../core/error/failures.dart';
import '../../../domain/usecases/create_review_use_case.dart';
import '../../../domain/usecases/update_review_use_case.dart';
import 'write_review_event.dart';
import 'write_review_state.dart';

@injectable
class WriteReviewBloc extends Bloc<WriteReviewEvent, WriteReviewState> {
  final CreateReviewUseCase _createReview;
  final UpdateReviewUseCase _updateReview;

  WriteReviewBloc(
    this._createReview,
    this._updateReview,
  ) : super(const WriteReviewInitial()) {
    on<SubmitReviewEvent>(_onSubmitReview);
    on<UpdateReviewSubmitEvent>(_onUpdateReviewSubmit);
  }

  Future<void> _onSubmitReview(
    SubmitReviewEvent event,
    Emitter<WriteReviewState> emit,
  ) async {
    emit(const WriteReviewSubmitting());
    final result = await _createReview(
      merchantId: event.merchantId,
      rating: event.rating,
      title: event.title,
      comment: event.comment,
    );
    result.fold(
      (failure) {
        if (failure is ConflictFailure) {
          emit(const WriteReviewDuplicate());
        } else if (failure is ServerFailure && failure.statusCode == 403) {
          emit(const WriteReviewNoTransaction());
        } else {
          emit(WriteReviewError(failure.message));
        }
      },
      (review) => emit(WriteReviewSuccess(review)),
    );
  }

  Future<void> _onUpdateReviewSubmit(
    UpdateReviewSubmitEvent event,
    Emitter<WriteReviewState> emit,
  ) async {
    emit(const WriteReviewSubmitting());
    final result = await _updateReview(
      reviewId: event.reviewId,
      rating: event.rating,
      title: event.title,
      comment: event.comment,
    );
    result.fold(
      (failure) => emit(WriteReviewError(failure.message)),
      (review) => emit(WriteReviewSuccess(review)),
    );
  }
}
