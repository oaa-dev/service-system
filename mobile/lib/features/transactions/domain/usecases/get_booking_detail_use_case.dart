import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../entities/booking_entity.dart';
import '../repositories/transactions_repository.dart';

@lazySingleton
class GetBookingDetailUseCase {
  final TransactionsRepository _repository;

  const GetBookingDetailUseCase(this._repository);

  Future<Either<Failure, BookingEntity>> call(int id) {
    return _repository.getBookingDetail(id);
  }
}
