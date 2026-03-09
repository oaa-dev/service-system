import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../repositories/storefront_repository.dart';

@lazySingleton
class CreateOrderUseCase {
  final StorefrontRepository _repository;

  const CreateOrderUseCase(this._repository);

  Future<Either<Failure, Map<String, dynamic>>> call({
    required String slug,
    required Map<String, dynamic> data,
  }) {
    return _repository.createOrder(slug: slug, data: data);
  }
}
