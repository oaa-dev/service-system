import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../entities/dashboard_stats_entity.dart';
import '../repositories/dashboard_repository.dart';

@lazySingleton
class GetDashboardStatsUseCase {
  final DashboardRepository _repository;

  const GetDashboardStatsUseCase(this._repository);

  Future<Either<Failure, DashboardStatsEntity>> call() {
    return _repository.getDashboardStats();
  }
}
