import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/api_client.dart';
import '../models/dashboard_stats_model.dart';

abstract class DashboardRemoteDataSource {
  Future<Either<Failure, DashboardStatsModel>> getDashboardStats();
}

@LazySingleton(as: DashboardRemoteDataSource)
class DashboardRemoteDataSourceImpl implements DashboardRemoteDataSource {
  final ApiClient _apiClient;

  const DashboardRemoteDataSourceImpl(this._apiClient);

  @override
  Future<Either<Failure, DashboardStatsModel>> getDashboardStats() async {
    final result = await _apiClient.get(ApiConstants.myStats);
    return result.map((json) {
      final data = json['data'] as Map<String, dynamic>;
      return DashboardStatsModel.fromJson(data);
    });
  }
}
