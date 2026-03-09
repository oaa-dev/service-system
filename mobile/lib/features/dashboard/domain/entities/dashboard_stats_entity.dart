import 'package:equatable/equatable.dart';

class DashboardStatsEntity extends Equatable {
  final int totalBookings;
  final int upcomingBookings;
  final int totalReservations;
  final int activeReservations;
  final int totalOrders;
  final int activeOrders;

  const DashboardStatsEntity({
    required this.totalBookings,
    required this.upcomingBookings,
    required this.totalReservations,
    required this.activeReservations,
    required this.totalOrders,
    required this.activeOrders,
  });

  @override
  List<Object?> get props => [
        totalBookings,
        upcomingBookings,
        totalReservations,
        activeReservations,
        totalOrders,
        activeOrders,
      ];
}
