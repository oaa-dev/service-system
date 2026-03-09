import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../entities/reservation_entity.dart';
import '../repositories/transactions_repository.dart';

@lazySingleton
class CancelReservationUseCase {
  final TransactionsRepository _repository;

  const CancelReservationUseCase(this._repository);

  Future<Either<Failure, ReservationEntity>> call(int id) {
    return _repository.cancelReservation(id);
  }
}
