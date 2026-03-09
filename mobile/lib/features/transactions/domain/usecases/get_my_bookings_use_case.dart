import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../entities/booking_entity.dart';
import '../repositories/transactions_repository.dart';

@lazySingleton
class GetMyBookingsUseCase {
  final TransactionsRepository _repository;

  const GetMyBookingsUseCase(this._repository);

  Future<Either<Failure, List<BookingEntity>>> call({
    int page = 1,
    String? status,
    String sort = '-booking_date',
  }) {
    return _repository.getMyBookings(page: page, status: status, sort: sort);
  }
}
