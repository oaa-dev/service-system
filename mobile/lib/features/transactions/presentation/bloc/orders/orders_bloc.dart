import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';
import '../../../domain/usecases/get_my_orders_use_case.dart';
import '../../../domain/usecases/cancel_order_use_case.dart';
import 'orders_event.dart';
import 'orders_state.dart';

@injectable
class OrdersBloc extends Bloc<OrdersEvent, OrdersState> {
  final GetMyOrdersUseCase _getMyOrders;
  final CancelOrderUseCase _cancelOrder;

  String? _currentFilter;

  OrdersBloc(this._getMyOrders, this._cancelOrder)
      : super(const OrdersInitial()) {
    on<LoadOrdersEvent>(_onLoad);
    on<LoadMoreOrdersEvent>(_onLoadMore);
    on<CancelOrderEvent>(_onCancel);
    on<RefreshOrdersEvent>(_onRefresh);
  }

  Future<void> _onLoad(
      LoadOrdersEvent event, Emitter<OrdersState> emit) async {
    emit(const OrdersLoading());
    _currentFilter = event.statusFilter;
    final result = await _getMyOrders(page: 1, status: _currentFilter);
    result.fold(
      (failure) => emit(OrdersError(failure.message)),
      (orders) => emit(OrdersLoaded(
        orders: orders,
        activeFilter: _currentFilter,
        hasMore: orders.length >= 15,
        currentPage: 1,
      )),
    );
  }

  Future<void> _onLoadMore(
      LoadMoreOrdersEvent event, Emitter<OrdersState> emit) async {
    final current = state;
    if (current is! OrdersLoaded || !current.hasMore) return;

    final nextPage = current.currentPage + 1;
    final result =
        await _getMyOrders(page: nextPage, status: _currentFilter);
    result.fold(
      (failure) => emit(OrdersError(failure.message)),
      (newOrders) => emit(current.copyWith(
        orders: [...current.orders, ...newOrders],
        hasMore: newOrders.length >= 15,
        currentPage: nextPage,
      )),
    );
  }

  Future<void> _onCancel(
      CancelOrderEvent event, Emitter<OrdersState> emit) async {
    final current = state;
    if (current is! OrdersLoaded) return;

    emit(OrderCancelling(
        orders: current.orders, cancellingId: event.orderId));
    final result = await _cancelOrder(event.orderId);
    result.fold(
      (failure) => emit(OrdersError(failure.message)),
      (updated) {
        final updatedList = current.orders
            .map((o) => o.id == updated.id ? updated : o)
            .toList();
        emit(current.copyWith(orders: updatedList));
      },
    );
  }

  Future<void> _onRefresh(
      RefreshOrdersEvent event, Emitter<OrdersState> emit) async {
    final result = await _getMyOrders(page: 1, status: _currentFilter);
    result.fold(
      (failure) => emit(OrdersError(failure.message)),
      (orders) => emit(OrdersLoaded(
        orders: orders,
        activeFilter: _currentFilter,
        hasMore: orders.length >= 15,
        currentPage: 1,
      )),
    );
  }
}
