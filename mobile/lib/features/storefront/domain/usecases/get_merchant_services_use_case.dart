import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../entities/service_entity.dart';
import '../repositories/storefront_repository.dart';

@lazySingleton
class GetMerchantServicesUseCase {
  final StorefrontRepository _repository;

  const GetMerchantServicesUseCase(this._repository);

  Future<Either<Failure, List<ServiceEntity>>> call(String slug) {
    return _repository.getMerchantServices(slug);
  }
}
