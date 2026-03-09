import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/api_client.dart';
import '../models/advertisement_model.dart';

abstract class AdsRemoteDataSource {
  Future<Either<Failure, List<AdvertisementModel>>> getAdvertisements();
  Future<void> trackImpression(int id);
  Future<void> trackClick(int id);
}

@LazySingleton(as: AdsRemoteDataSource)
class AdsRemoteDataSourceImpl implements AdsRemoteDataSource {
  final ApiClient _apiClient;

  const AdsRemoteDataSourceImpl(this._apiClient);

  @override
  Future<Either<Failure, List<AdvertisementModel>>> getAdvertisements() async {
    final result = await _apiClient.get(ApiConstants.advertisements);
    return result.map((json) {
      final data = json['data'] as List<dynamic>;
      return data
          .map((item) =>
              AdvertisementModel.fromJson(item as Map<String, dynamic>))
          .toList();
    });
  }

  @override
  Future<void> trackImpression(int id) async {
    // Fire and forget — ignore result
    _apiClient.post(ApiConstants.adImpression(id));
  }

  @override
  Future<void> trackClick(int id) async {
    // Fire and forget — ignore result
    _apiClient.post(ApiConstants.adClick(id));
  }
}
