import 'package:json_annotation/json_annotation.dart';

part 'dashboard_stats_model.g.dart';

@JsonSerializable()
class DashboardStatsModel {
  final BookingStatsModel bookings;
  final ReservationStatsModel reservations;
  final OrderStatsModel orders;

  const DashboardStatsModel({
    required this.bookings,
    required this.reservations,
    required this.orders,
  });

  factory DashboardStatsModel.fromJson(Map<String, dynamic> json) =>
      _$DashboardStatsModelFromJson(json);

  Map<String, dynamic> toJson() => _$DashboardStatsModelToJson(this);
}

@JsonSerializable()
class BookingStatsModel {
  final int total;
  final int upcoming;

  const BookingStatsModel({
    required this.total,
    required this.upcoming,
  });

  factory BookingStatsModel.fromJson(Map<String, dynamic> json) =>
      _$BookingStatsModelFromJson(json);

  Map<String, dynamic> toJson() => _$BookingStatsModelToJson(this);
}

@JsonSerializable()
class ReservationStatsModel {
  final int total;
  final int active;

  const ReservationStatsModel({
    required this.total,
    required this.active,
  });

  factory ReservationStatsModel.fromJson(Map<String, dynamic> json) =>
      _$ReservationStatsModelFromJson(json);

  Map<String, dynamic> toJson() => _$ReservationStatsModelToJson(this);
}

@JsonSerializable()
class OrderStatsModel {
  final int total;
  final int active;

  const OrderStatsModel({
    required this.total,
    required this.active,
  });

  factory OrderStatsModel.fromJson(Map<String, dynamic> json) =>
      _$OrderStatsModelFromJson(json);

  Map<String, dynamic> toJson() => _$OrderStatsModelToJson(this);
}
