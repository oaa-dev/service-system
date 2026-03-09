import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/booking_entity.dart';
import '../../domain/entities/reservation_entity.dart';
import '../../domain/entities/service_order_entity.dart';
import '../../domain/repositories/transactions_repository.dart';
import '../datasources/transactions_remote_data_source.dart';
import '../models/booking_model.dart';
import '../models/reservation_model.dart';
import '../models/service_order_model.dart';

@LazySingleton(as: TransactionsRepository)
class TransactionsRepositoryImpl implements TransactionsRepository {
  final TransactionsRemoteDataSource _remote;

  const TransactionsRepositoryImpl(this._remote);

  // -- Bookings --

  @override
  Future<Either<Failure, List<BookingEntity>>> getMyBookings({
    int page = 1,
    String? status,
    String sort = '-booking_date',
  }) async {
    final result = await _remote.getMyBookings(
      page: page,
      status: status,
      sort: sort,
    );
    return result.map((models) => models.map(_toBookingEntity).toList());
  }

  @override
  Future<Either<Failure, BookingEntity>> getBookingDetail(int id) async {
    final result = await _remote.getBookingDetail(id);
    return result.map(_toBookingEntity);
  }

  @override
  Future<Either<Failure, BookingEntity>> cancelBooking(int id) async {
    final result = await _remote.cancelBooking(id);
    return result.map(_toBookingEntity);
  }

  // -- Reservations --

  @override
  Future<Either<Failure, List<ReservationEntity>>> getMyReservations({
    int page = 1,
    String? status,
    String sort = '-check_in',
  }) async {
    final result = await _remote.getMyReservations(
      page: page,
      status: status,
      sort: sort,
    );
    return result.map((models) => models.map(_toReservationEntity).toList());
  }

  @override
  Future<Either<Failure, ReservationEntity>> getReservationDetail(int id) async {
    final result = await _remote.getReservationDetail(id);
    return result.map(_toReservationEntity);
  }

  @override
  Future<Either<Failure, ReservationEntity>> cancelReservation(int id) async {
    final result = await _remote.cancelReservation(id);
    return result.map(_toReservationEntity);
  }

  // -- Orders --

  @override
  Future<Either<Failure, List<ServiceOrderEntity>>> getMyOrders({
    int page = 1,
    String? status,
    String sort = '-created_at',
  }) async {
    final result = await _remote.getMyOrders(
      page: page,
      status: status,
      sort: sort,
    );
    return result.map((models) => models.map(_toOrderEntity).toList());
  }

  @override
  Future<Either<Failure, ServiceOrderEntity>> getOrderDetail(int id) async {
    final result = await _remote.getOrderDetail(id);
    return result.map(_toOrderEntity);
  }

  @override
  Future<Either<Failure, ServiceOrderEntity>> cancelOrder(int id) async {
    final result = await _remote.cancelOrder(id);
    return result.map(_toOrderEntity);
  }

  // -- Mappers --

  BookingEntity _toBookingEntity(BookingModel model) => BookingEntity(
        id: model.id,
        merchantName: model.merchantName,
        merchantLogo: model.merchantLogo,
        serviceName: model.serviceName,
        bookingDate: model.bookingDate,
        startTime: model.startTime,
        endTime: model.endTime,
        partySize: model.partySize,
        servicePrice: model.servicePrice,
        feeAmount: model.feeAmount,
        totalAmount: model.totalAmount,
        discountAmount: model.discountAmount,
        status: model.status,
        paymentStatus: model.paymentStatus,
        notes: model.notes,
        confirmedAt: model.confirmedAt,
        cancelledAt: model.cancelledAt,
        createdAt: model.createdAt,
      );

  ReservationEntity _toReservationEntity(ReservationModel model) =>
      ReservationEntity(
        id: model.id,
        merchantName: model.merchantName,
        merchantLogo: model.merchantLogo,
        serviceName: model.serviceName,
        unitName: model.unitName,
        checkIn: model.checkIn,
        checkOut: model.checkOut,
        guestCount: model.guestCount,
        nights: model.nights,
        pricePerNight: model.pricePerNight,
        totalPrice: model.totalPrice,
        feeAmount: model.feeAmount,
        totalAmount: model.totalAmount,
        discountAmount: model.discountAmount,
        status: model.status,
        paymentStatus: model.paymentStatus,
        notes: model.notes,
        specialRequests: model.specialRequests,
        confirmedAt: model.confirmedAt,
        cancelledAt: model.cancelledAt,
        createdAt: model.createdAt,
      );

  ServiceOrderEntity _toOrderEntity(ServiceOrderModel model) =>
      ServiceOrderEntity(
        id: model.id,
        orderNumber: model.orderNumber,
        merchantName: model.merchantName,
        merchantLogo: model.merchantLogo,
        serviceName: model.serviceName,
        quantity: model.quantity,
        unitLabel: model.unitLabel,
        unitPrice: model.unitPrice,
        totalPrice: model.totalPrice,
        feeAmount: model.feeAmount,
        totalAmount: model.totalAmount,
        discountAmount: model.discountAmount,
        status: model.status,
        paymentStatus: model.paymentStatus,
        notes: model.notes,
        estimatedCompletion: model.estimatedCompletion,
        completedAt: model.completedAt,
        cancelledAt: model.cancelledAt,
        createdAt: model.createdAt,
      );
}
