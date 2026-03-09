import 'package:fpdart/fpdart.dart';
import 'package:geolocator/geolocator.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/api_client.dart';
import '../models/booking_availability_model.dart';
import '../models/merchant_model.dart';
import '../models/service_model.dart';

abstract class StorefrontRemoteDataSource {
  Future<Either<Failure, Map<String, dynamic>>> getMerchants({
    String? query,
    double? lat,
    double? lng,
    double? radius,
    int page = 1,
  });

  Future<Either<Failure, MerchantModel>> getMerchantBySlug(String slug);

  Future<Either<Failure, List<ServiceModel>>> getMerchantServices(String slug);

  Future<Either<Failure, Position>> getCurrentPosition();

  Future<Either<Failure, BookingAvailabilityModel>> getBookingAvailability(
      String slug, int serviceId, String date);

  Future<Either<Failure, Map<String, dynamic>>> createBooking(
      String slug, Map<String, dynamic> data);

  Future<Either<Failure, Map<String, dynamic>>> createReservation(
      String slug, Map<String, dynamic> data);

  Future<Either<Failure, Map<String, dynamic>>> createOrder(
      String slug, Map<String, dynamic> data);
}

@LazySingleton(as: StorefrontRemoteDataSource)
class StorefrontRemoteDataSourceImpl implements StorefrontRemoteDataSource {
  final ApiClient _apiClient;

  const StorefrontRemoteDataSourceImpl(this._apiClient);

  @override
  Future<Either<Failure, Map<String, dynamic>>> getMerchants({
    String? query,
    double? lat,
    double? lng,
    double? radius,
    int page = 1,
  }) async {
    final params = <String, dynamic>{'page': page};
    if (query != null && query.isNotEmpty) {
      params['filter[name]'] = query;
    }
    if (lat != null) params['lat'] = lat;
    if (lng != null) params['lng'] = lng;
    if (radius != null) params['radius'] = radius;

    return _apiClient.get(
      ApiConstants.storefrontMerchants,
      queryParameters: params,
    );
  }

  @override
  Future<Either<Failure, MerchantModel>> getMerchantBySlug(String slug) async {
    final result = await _apiClient.get(ApiConstants.storefrontMerchant(slug));
    return result.map((json) {
      final data = json['data'] as Map<String, dynamic>;
      return MerchantModel.fromJson(data);
    });
  }

  @override
  Future<Either<Failure, List<ServiceModel>>> getMerchantServices(
      String slug) async {
    final result =
        await _apiClient.get(ApiConstants.merchantServices(slug));
    return result.map((json) {
      final data = json['data'] as List<dynamic>;
      return data
          .map((item) => ServiceModel.fromJson(item as Map<String, dynamic>))
          .toList();
    });
  }

  @override
  Future<Either<Failure, Position>> getCurrentPosition() async {
    try {
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied ||
            permission == LocationPermission.deniedForever) {
          return const Left(ServerFailure('Location permission denied'));
        }
      }
      if (permission == LocationPermission.deniedForever) {
        return const Left(
            ServerFailure('Location permission permanently denied'));
      }
      final position = await Geolocator.getCurrentPosition();
      return Right(position);
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, BookingAvailabilityModel>> getBookingAvailability(
      String slug, int serviceId, String date) async {
    final result = await _apiClient.get(
      ApiConstants.bookingAvailability(slug, serviceId),
      queryParameters: {'date': date},
    );
    return result.map((json) {
      final data = json['data'] as Map<String, dynamic>;
      return BookingAvailabilityModel.fromJson(data);
    });
  }

  @override
  Future<Either<Failure, Map<String, dynamic>>> createBooking(
      String slug, Map<String, dynamic> data) async {
    return _apiClient.post(ApiConstants.createBooking(slug), data: data);
  }

  @override
  Future<Either<Failure, Map<String, dynamic>>> createReservation(
      String slug, Map<String, dynamic> data) async {
    return _apiClient.post(ApiConstants.createReservation(slug), data: data);
  }

  @override
  Future<Either<Failure, Map<String, dynamic>>> createOrder(
      String slug, Map<String, dynamic> data) async {
    return _apiClient.post(ApiConstants.createOrder(slug), data: data);
  }
}
