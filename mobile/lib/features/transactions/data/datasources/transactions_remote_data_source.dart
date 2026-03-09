import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/api_client.dart';
import '../models/booking_model.dart';
import '../models/reservation_model.dart';
import '../models/service_order_model.dart';

abstract class TransactionsRemoteDataSource {
  // Bookings
  Future<Either<Failure, List<BookingModel>>> getMyBookings({
    int page = 1,
    String? status,
    String sort = '-booking_date',
  });

  Future<Either<Failure, BookingModel>> getBookingDetail(int id);

  Future<Either<Failure, BookingModel>> cancelBooking(int id);

  // Reservations
  Future<Either<Failure, List<ReservationModel>>> getMyReservations({
    int page = 1,
    String? status,
    String sort = '-check_in',
  });

  Future<Either<Failure, ReservationModel>> getReservationDetail(int id);

  Future<Either<Failure, ReservationModel>> cancelReservation(int id);

  // Orders
  Future<Either<Failure, List<ServiceOrderModel>>> getMyOrders({
    int page = 1,
    String? status,
    String sort = '-created_at',
  });

  Future<Either<Failure, ServiceOrderModel>> getOrderDetail(int id);

  Future<Either<Failure, ServiceOrderModel>> cancelOrder(int id);
}

@LazySingleton(as: TransactionsRemoteDataSource)
class TransactionsRemoteDataSourceImpl implements TransactionsRemoteDataSource {
  final ApiClient _apiClient;

  const TransactionsRemoteDataSourceImpl(this._apiClient);

  // -- Bookings --

  @override
  Future<Either<Failure, List<BookingModel>>> getMyBookings({
    int page = 1,
    String? status,
    String sort = '-booking_date',
  }) async {
    final result = await _apiClient.get(
      ApiConstants.myBookings,
      queryParameters: {
        'page': page,
        if (status != null) 'filter[status]': status, // ignore: use_null_aware_elements
        'sort': sort,
      },
    );
    return result.map((json) {
      final dataList = json['data'] as List;
      return dataList
          .map((e) => BookingModel.fromJson(e as Map<String, dynamic>))
          .toList();
    });
  }

  @override
  Future<Either<Failure, BookingModel>> getBookingDetail(int id) async {
    final result = await _apiClient.get(ApiConstants.myBookingDetail(id));
    return result.map((json) {
      final data = json['data'] as Map<String, dynamic>;
      return BookingModel.fromJson(data);
    });
  }

  @override
  Future<Either<Failure, BookingModel>> cancelBooking(int id) async {
    final result = await _apiClient.patch(ApiConstants.cancelBooking(id));
    return result.map((json) {
      final data = json['data'] as Map<String, dynamic>;
      return BookingModel.fromJson(data);
    });
  }

  // -- Reservations --

  @override
  Future<Either<Failure, List<ReservationModel>>> getMyReservations({
    int page = 1,
    String? status,
    String sort = '-check_in',
  }) async {
    final result = await _apiClient.get(
      ApiConstants.myReservations,
      queryParameters: {
        'page': page,
        if (status != null) 'filter[status]': status, // ignore: use_null_aware_elements
        'sort': sort,
      },
    );
    return result.map((json) {
      final dataList = json['data'] as List;
      return dataList
          .map((e) => ReservationModel.fromJson(e as Map<String, dynamic>))
          .toList();
    });
  }

  @override
  Future<Either<Failure, ReservationModel>> getReservationDetail(int id) async {
    final result = await _apiClient.get(ApiConstants.myReservationDetail(id));
    return result.map((json) {
      final data = json['data'] as Map<String, dynamic>;
      return ReservationModel.fromJson(data);
    });
  }

  @override
  Future<Either<Failure, ReservationModel>> cancelReservation(int id) async {
    final result = await _apiClient.patch(ApiConstants.cancelReservation(id));
    return result.map((json) {
      final data = json['data'] as Map<String, dynamic>;
      return ReservationModel.fromJson(data);
    });
  }

  // -- Orders --

  @override
  Future<Either<Failure, List<ServiceOrderModel>>> getMyOrders({
    int page = 1,
    String? status,
    String sort = '-created_at',
  }) async {
    final result = await _apiClient.get(
      ApiConstants.myOrders,
      queryParameters: {
        'page': page,
        if (status != null) 'filter[status]': status, // ignore: use_null_aware_elements
        'sort': sort,
      },
    );
    return result.map((json) {
      final dataList = json['data'] as List;
      return dataList
          .map((e) => ServiceOrderModel.fromJson(e as Map<String, dynamic>))
          .toList();
    });
  }

  @override
  Future<Either<Failure, ServiceOrderModel>> getOrderDetail(int id) async {
    final result = await _apiClient.get(ApiConstants.myOrderDetail(id));
    return result.map((json) {
      final data = json['data'] as Map<String, dynamic>;
      return ServiceOrderModel.fromJson(data);
    });
  }

  @override
  Future<Either<Failure, ServiceOrderModel>> cancelOrder(int id) async {
    final result = await _apiClient.patch(ApiConstants.cancelOrder(id));
    return result.map((json) {
      final data = json['data'] as Map<String, dynamic>;
      return ServiceOrderModel.fromJson(data);
    });
  }
}
