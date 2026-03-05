import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../entities/merchant_entity.dart';
import '../repositories/storefront_repository.dart';

@lazySingleton
class GetMerchantDetailUseCase {
  final StorefrontRepository _repository;

  const GetMerchantDetailUseCase(this._repository);

  Future<Either<Failure, MerchantEntity>> call(String slug) {
    return _repository.getMerchantBySlug(slug);
  }
}
