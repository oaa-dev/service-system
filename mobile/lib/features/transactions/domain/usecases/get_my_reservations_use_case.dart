import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../entities/reservation_entity.dart';
import '../repositories/transactions_repository.dart';

@lazySingleton
class GetMyReservationsUseCase {
  final TransactionsRepository _repository;

  const GetMyReservationsUseCase(this._repository);

  Future<Either<Failure, List<ReservationEntity>>> call({
    int page = 1,
    String? status,
    String sort = '-check_in',
  }) {
    return _repository.getMyReservations(page: page, status: status, sort: sort);
  }
}
