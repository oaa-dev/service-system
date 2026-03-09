import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failures.dart';
import '../entities/booking_entity.dart';
import '../entities/reservation_entity.dart';
import '../entities/service_order_entity.dart';

abstract class TransactionsRepository {
  // Bookings
  Future<Either<Failure, List<BookingEntity>>> getMyBookings({
    int page = 1,
    String? status,
    String sort = '-booking_date',
  });

  Future<Either<Failure, BookingEntity>> getBookingDetail(int id);

  Future<Either<Failure, BookingEntity>> cancelBooking(int id);

  // Reservations
  Future<Either<Failure, List<ReservationEntity>>> getMyReservations({
    int page = 1,
    String? status,
    String sort = '-check_in',
  });

  Future<Either<Failure, ReservationEntity>> getReservationDetail(int id);

  Future<Either<Failure, ReservationEntity>> cancelReservation(int id);

  // Orders
  Future<Either<Failure, List<ServiceOrderEntity>>> getMyOrders({
    int page = 1,
    String? status,
    String sort = '-created_at',
  });

  Future<Either<Failure, ServiceOrderEntity>> getOrderDetail(int id);

  Future<Either<Failure, ServiceOrderEntity>> cancelOrder(int id);
}
