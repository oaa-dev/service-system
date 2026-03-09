import 'package:equatable/equatable.dart';

sealed class DashboardEvent extends Equatable {
  const DashboardEvent();

  @override
  List<Object?> get props => [];
}

class LoadDashboardStatsEvent extends DashboardEvent {
  const LoadDashboardStatsEvent();
}
