import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/dashboard_stats_entity.dart';
import '../../domain/repositories/dashboard_repository.dart';
import '../datasources/dashboard_remote_data_source.dart';
import '../models/dashboard_stats_model.dart';

@LazySingleton(as: DashboardRepository)
class DashboardRepositoryImpl implements DashboardRepository {
  final DashboardRemoteDataSource _remote;

  const DashboardRepositoryImpl(this._remote);

  @override
  Future<Either<Failure, DashboardStatsEntity>> getDashboardStats() async {
    final result = await _remote.getDashboardStats();
    return result.map(_toEntity);
  }

  DashboardStatsEntity _toEntity(DashboardStatsModel model) {
    return DashboardStatsEntity(
      totalBookings: model.bookings.total,
      upcomingBookings: model.bookings.upcoming,
      totalReservations: model.reservations.total,
      activeReservations: model.reservations.active,
      totalOrders: model.orders.total,
      activeOrders: model.orders.active,
    );
  }
}
