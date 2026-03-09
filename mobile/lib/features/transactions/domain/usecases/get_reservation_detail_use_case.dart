import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../entities/reservation_entity.dart';
import '../repositories/transactions_repository.dart';

@lazySingleton
class GetReservationDetailUseCase {
  final TransactionsRepository _repository;

  const GetReservationDetailUseCase(this._repository);

  Future<Either<Failure, ReservationEntity>> call(int id) {
    return _repository.getReservationDetail(id);
  }
}
