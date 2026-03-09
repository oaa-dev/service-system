import 'package:equatable/equatable.dart';

sealed class OrdersEvent extends Equatable {
  const OrdersEvent();
  @override
  List<Object?> get props => [];
}

class LoadOrdersEvent extends OrdersEvent {
  final String? statusFilter;
  const LoadOrdersEvent({this.statusFilter});
  @override
  List<Object?> get props => [statusFilter];
}

class LoadMoreOrdersEvent extends OrdersEvent {
  const LoadMoreOrdersEvent();
}

class CancelOrderEvent extends OrdersEvent {
  final int orderId;
  const CancelOrderEvent(this.orderId);
  @override
  List<Object?> get props => [orderId];
}

class RefreshOrdersEvent extends OrdersEvent {
  const RefreshOrdersEvent();
}
