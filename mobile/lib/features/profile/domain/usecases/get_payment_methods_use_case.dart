import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../entities/payment_method_entity.dart';
import '../repositories/profile_repository.dart';

@lazySingleton
class GetPaymentMethodsUseCase {
  final ProfileRepository _repository;

  const GetPaymentMethodsUseCase(this._repository);

  Future<Either<Failure, List<PaymentMethodEntity>>> call() {
    return _repository.getPaymentMethods();
  }
}
