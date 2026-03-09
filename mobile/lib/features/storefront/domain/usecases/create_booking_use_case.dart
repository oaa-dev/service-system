import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../repositories/storefront_repository.dart';

@lazySingleton
class CreateBookingUseCase {
  final StorefrontRepository _repository;

  const CreateBookingUseCase(this._repository);

  Future<Either<Failure, Map<String, dynamic>>> call({
    required String slug,
    required Map<String, dynamic> data,
  }) {
    return _repository.createBooking(slug: slug, data: data);
  }
}
