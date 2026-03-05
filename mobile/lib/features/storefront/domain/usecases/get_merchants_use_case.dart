import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../repositories/storefront_repository.dart';

@lazySingleton
class GetMerchantsUseCase {
  final StorefrontRepository _repository;

  const GetMerchantsUseCase(this._repository);

  Future<Either<Failure, MerchantsResult>> call({
    String? query,
    double? lat,
    double? lng,
    double? radius,
    int page = 1,
  }) {
    return _repository.getMerchants(
      query: query,
      lat: lat,
      lng: lng,
      radius: radius,
      page: page,
    );
  }
}
