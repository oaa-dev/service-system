import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../entities/service_order_entity.dart';
import '../repositories/transactions_repository.dart';

@lazySingleton
class GetMyOrdersUseCase {
  final TransactionsRepository _repository;

  const GetMyOrdersUseCase(this._repository);

  Future<Either<Failure, List<ServiceOrderEntity>>> call({
    int page = 1,
    String? status,
    String sort = '-created_at',
  }) {
    return _repository.getMyOrders(page: page, status: status, sort: sort);
  }
}
