import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../repositories/storefront_repository.dart';

@lazySingleton
class CreateReservationUseCase {
  final StorefrontRepository _repository;

  const CreateReservationUseCase(this._repository);

  Future<Either<Failure, Map<String, dynamic>>> call({
    required String slug,
    required Map<String, dynamic> data,
  }) {
    return _repository.createReservation(slug: slug, data: data);
  }
}
