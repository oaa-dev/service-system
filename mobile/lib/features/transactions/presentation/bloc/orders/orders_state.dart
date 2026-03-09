import 'package:equatable/equatable.dart';
import '../../../domain/entities/service_order_entity.dart';

sealed class OrdersState extends Equatable {
  const OrdersState();
  @override
  List<Object?> get props => [];
}

class OrdersInitial extends OrdersState {
  const OrdersInitial();
}

class OrdersLoading extends OrdersState {
  const OrdersLoading();
}

class OrdersLoaded extends OrdersState {
  final List<ServiceOrderEntity> orders;
  final String? activeFilter;
  final bool hasMore;
  final int currentPage;

  const OrdersLoaded({
    required this.orders,
    this.activeFilter,
    this.hasMore = true,
    this.currentPage = 1,
  });

  OrdersLoaded copyWith({
    List<ServiceOrderEntity>? orders,
    String? activeFilter,
    bool? hasMore,
    int? currentPage,
  }) {
    return OrdersLoaded(
      orders: orders ?? this.orders,
      activeFilter: activeFilter,
      hasMore: hasMore ?? this.hasMore,
      currentPage: currentPage ?? this.currentPage,
    );
  }

  @override
  List<Object?> get props => [orders, activeFilter, hasMore, currentPage];
}

class OrderCancelling extends OrdersState {
  final List<ServiceOrderEntity> orders;
  final int cancellingId;
  const OrderCancelling(
      {required this.orders, required this.cancellingId});
  @override
  List<Object?> get props => [orders, cancellingId];
}

class OrdersError extends OrdersState {
  final String message;
  const OrdersError(this.message);
  @override
  List<Object?> get props => [message];
}
