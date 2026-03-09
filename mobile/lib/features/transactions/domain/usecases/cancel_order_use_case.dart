import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../entities/service_order_entity.dart';
import '../repositories/transactions_repository.dart';

@lazySingleton
class CancelOrderUseCase {
  final TransactionsRepository _repository;

  const CancelOrderUseCase(this._repository);

  Future<Either<Failure, ServiceOrderEntity>> call(int id) {
    return _repository.cancelOrder(id);
  }
}
