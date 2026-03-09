import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../entities/booking_entity.dart';
import '../repositories/transactions_repository.dart';

@lazySingleton
class CancelBookingUseCase {
  final TransactionsRepository _repository;

  const CancelBookingUseCase(this._repository);

  Future<Either<Failure, BookingEntity>> call(int id) {
    return _repository.cancelBooking(id);
  }
}
