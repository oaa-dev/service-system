// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'dashboard_stats_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

DashboardStatsModel _$DashboardStatsModelFromJson(Map<String, dynamic> json) =>
    DashboardStatsModel(
      bookings: BookingStatsModel.fromJson(
        json['bookings'] as Map<String, dynamic>,
      ),
      reservations: ReservationStatsModel.fromJson(
        json['reservations'] as Map<String, dynamic>,
      ),
      orders: OrderStatsModel.fromJson(json['orders'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$DashboardStatsModelToJson(
  DashboardStatsModel instance,
) => <String, dynamic>{
  'bookings': instance.bookings,
  'reservations': instance.reservations,
  'orders': instance.orders,
};

BookingStatsModel _$BookingStatsModelFromJson(Map<String, dynamic> json) =>
    BookingStatsModel(
      total: (json['total'] as num).toInt(),
      upcoming: (json['upcoming'] as num).toInt(),
    );

Map<String, dynamic> _$BookingStatsModelToJson(BookingStatsModel instance) =>
    <String, dynamic>{'total': instance.total, 'upcoming': instance.upcoming};

ReservationStatsModel _$ReservationStatsModelFromJson(
  Map<String, dynamic> json,
) => ReservationStatsModel(
  total: (json['total'] as num).toInt(),
  active: (json['active'] as num).toInt(),
);

Map<String, dynamic> _$ReservationStatsModelToJson(
  ReservationStatsModel instance,
) => <String, dynamic>{'total': instance.total, 'active': instance.active};

OrderStatsModel _$OrderStatsModelFromJson(Map<String, dynamic> json) =>
    OrderStatsModel(
      total: (json['total'] as num).toInt(),
      active: (json['active'] as num).toInt(),
    );

Map<String, dynamic> _$OrderStatsModelToJson(OrderStatsModel instance) =>
    <String, dynamic>{'total': instance.total, 'active': instance.active};
