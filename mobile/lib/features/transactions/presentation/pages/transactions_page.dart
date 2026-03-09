import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../auth/presentation/bloc/auth_bloc.dart';
import '../../../auth/presentation/bloc/auth_state.dart';
import '../../../../core/widgets/shimmer_loading.dart';
import '../../domain/entities/booking_entity.dart';
import '../../domain/entities/reservation_entity.dart';
import '../../domain/entities/service_order_entity.dart';
import '../bloc/bookings/bookings_bloc.dart';
import '../bloc/bookings/bookings_event.dart';
import '../bloc/bookings/bookings_state.dart';
import '../bloc/reservations/reservations_bloc.dart';
import '../bloc/reservations/reservations_event.dart';
import '../bloc/reservations/reservations_state.dart';
import '../bloc/orders/orders_bloc.dart';
import '../bloc/orders/orders_event.dart';
import '../bloc/orders/orders_state.dart';
import '../widgets/status_chip.dart';
import '../widgets/empty_state.dart';
import '../widgets/booking_detail_sheet.dart';
import '../widgets/reservation_detail_sheet.dart';
import '../widgets/order_detail_sheet.dart';

class TransactionsPage extends StatefulWidget {
  const TransactionsPage({super.key});

  @override
  State<TransactionsPage> createState() => _TransactionsPageState();
}

class _TransactionsPageState extends State<TransactionsPage>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        backgroundColor: AppColors.surface,
        appBar: AppBar(
          title: Text('My Transactions', style: AppTypography.titleLarge),
          backgroundColor: AppColors.white,
          elevation: 0,
          scrolledUnderElevation: 0.5,
          bottom: TabBar(
            labelColor: AppColors.primary,
            unselectedLabelColor: AppColors.grey400,
            indicatorColor: AppColors.primary,
            indicatorWeight: 3,
            labelStyle: AppTypography.labelMedium,
            unselectedLabelStyle: AppTypography.labelMedium,
            tabs: const [
              Tab(icon: Icon(Icons.calendar_today_rounded), text: 'Bookings'),
              Tab(icon: Icon(Icons.hotel_rounded), text: 'Reservations'),
              Tab(icon: Icon(Icons.shopping_bag_rounded), text: 'Orders'),
            ],
          ),
        ),
        body: const TabBarView(
          children: [
            _BookingsTab(),
            _ReservationsTab(),
            _OrdersTab(),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Bookings Tab
// ---------------------------------------------------------------------------

class _BookingsTab extends StatefulWidget {
  const _BookingsTab();

  @override
  State<_BookingsTab> createState() => _BookingsTabState();
}

class _BookingsTabState extends State<_BookingsTab>
    with AutomaticKeepAliveClientMixin {
  final _scrollController = ScrollController();

  static const _filters = <String?>[
    null,
    'pending',
    'confirmed',
    'completed',
    'cancelled',
    'no_show',
  ];

  static const _filterLabels = [
    'All',
    'Pending',
    'Confirmed',
    'Completed',
    'Cancelled',
    'No Show',
  ];

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    context.read<BookingsBloc>().add(const LoadBookingsEvent());
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      context.read<BookingsBloc>().add(const LoadMoreBookingsEvent());
    }
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return BlocBuilder<BookingsBloc, BookingsState>(
      builder: (context, state) {
        return Column(
          children: [
            _buildFilterChips(state),
            Expanded(child: _buildBody(state)),
          ],
        );
      },
    );
  }

  Widget _buildFilterChips(BookingsState state) {
    final activeFilter = switch (state) {
      BookingsLoaded s => s.activeFilter,
      BookingCancelling s =>
        (s.bookings.isNotEmpty) ? null : null,
      _ => null,
    };

    return Container(
      color: AppColors.white,
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Row(
          children: List.generate(_filters.length, (i) {
            final isActive = activeFilter == _filters[i];
            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: FilterChip(
                label: Text(_filterLabels[i]),
                selected: isActive,
                onSelected: (_) {
                  context
                      .read<BookingsBloc>()
                      .add(LoadBookingsEvent(statusFilter: _filters[i]));
                },
                selectedColor: AppColors.primaryLight,
                checkmarkColor: AppColors.primary,
                labelStyle: AppTypography.labelSmall.copyWith(
                  color: isActive ? AppColors.primary : AppColors.grey500,
                ),
                backgroundColor: AppColors.grey100,
                side: BorderSide.none,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
            );
          }),
        ),
      ),
    );
  }

  Widget _buildBody(BookingsState state) {
    return switch (state) {
      BookingsInitial() || BookingsLoading() => _buildShimmerList(),
      BookingsError s => _buildError(s.message, () {
          context.read<BookingsBloc>().add(const LoadBookingsEvent());
        }),
      BookingsLoaded s => s.bookings.isEmpty
          ? TransactionEmptyState(
              icon: Icons.calendar_today_rounded,
              title: 'No bookings yet',
              subtitle: 'Book a service from your favorite merchants',
              ctaLabel: 'Explore Merchants',
              onCtaTap: () {},
            )
          : RefreshIndicator(
              color: AppColors.primary,
              onRefresh: () async {
                context
                    .read<BookingsBloc>()
                    .add(const RefreshBookingsEvent());
              },
              child: ListView.builder(
                controller: _scrollController,
                padding: const EdgeInsets.all(16),
                itemCount: s.bookings.length + (s.hasMore ? 1 : 0),
                itemBuilder: (context, index) {
                  if (index >= s.bookings.length) {
                    return const Padding(
                      padding: EdgeInsets.all(16),
                      child: Center(
                        child: CircularProgressIndicator(
                            color: AppColors.primary),
                      ),
                    );
                  }
                  return _buildBookingCard(s.bookings[index]);
                },
              ),
            ),
      BookingCancelling s => RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () async {
            context.read<BookingsBloc>().add(const RefreshBookingsEvent());
          },
          child: ListView.builder(
            controller: _scrollController,
            padding: const EdgeInsets.all(16),
            itemCount: s.bookings.length,
            itemBuilder: (context, index) {
              final booking = s.bookings[index];
              return Stack(
                children: [
                  _buildBookingCard(booking),
                  if (booking.id == s.cancellingId)
                    Positioned.fill(
                      child: Container(
                        decoration: BoxDecoration(
                          color: AppColors.white.withAlpha(180),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Center(
                          child: CircularProgressIndicator(
                              color: AppColors.primary),
                        ),
                      ),
                    ),
                ],
              );
            },
          ),
        ),
    };
  }

  Widget _buildBookingCard(BookingEntity booking) {
    return GestureDetector(
      onTap: () => _showBookingDetail(booking),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: AppColors.grey900.withAlpha(6),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: AppColors.primaryLight,
                borderRadius: BorderRadius.circular(12),
              ),
              child: booking.merchantLogo != null
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.network(booking.merchantLogo!,
                          fit: BoxFit.cover,
                          width: 48,
                          height: 48,
                          errorBuilder: (_, e, s) => const Icon(
                              Icons.calendar_today_rounded,
                              color: AppColors.primary,
                              size: 24)),
                    )
                  : const Icon(Icons.calendar_today_rounded,
                      color: AppColors.primary, size: 24),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(booking.merchantName ?? 'Booking',
                      style: AppTypography.titleSmall),
                  const SizedBox(height: 2),
                  Text(
                    '${booking.serviceName ?? ''} \u00B7 ${_formatDate(booking.bookingDate)}',
                    style: AppTypography.bodySmall,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      StatusChip(status: booking.status),
                      const Spacer(),
                      Text(
                        '\u20B1${booking.totalAmount}',
                        style: AppTypography.titleSmall
                            .copyWith(color: AppColors.primary),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showBookingDetail(BookingEntity booking) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        maxChildSize: 0.9,
        minChildSize: 0.5,
        builder: (_, controller) {
          final authState = context.read<AuthBloc>().state;
          final userId = authState is AuthAuthenticated ? authState.user.id : 0;
          return BookingDetailSheet(
            booking: booking,
            currentUserId: userId,
            onCancel: () {
              Navigator.pop(context);
              context
                  .read<BookingsBloc>()
                  .add(CancelBookingEvent(booking.id));
            },
          );
        },
      ),
    );
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('MMM d, yyyy').format(date);
    } catch (_) {
      return dateStr;
    }
  }
}

// ---------------------------------------------------------------------------
// Reservations Tab
// ---------------------------------------------------------------------------

class _ReservationsTab extends StatefulWidget {
  const _ReservationsTab();

  @override
  State<_ReservationsTab> createState() => _ReservationsTabState();
}

class _ReservationsTabState extends State<_ReservationsTab>
    with AutomaticKeepAliveClientMixin {
  final _scrollController = ScrollController();

  static const _filters = <String?>[
    null,
    'pending',
    'confirmed',
    'checked_in',
    'checked_out',
    'cancelled',
  ];

  static const _filterLabels = [
    'All',
    'Pending',
    'Confirmed',
    'Checked In',
    'Checked Out',
    'Cancelled',
  ];

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    context.read<ReservationsBloc>().add(const LoadReservationsEvent());
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      context
          .read<ReservationsBloc>()
          .add(const LoadMoreReservationsEvent());
    }
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return BlocBuilder<ReservationsBloc, ReservationsState>(
      builder: (context, state) {
        return Column(
          children: [
            _buildFilterChips(state),
            Expanded(child: _buildBody(state)),
          ],
        );
      },
    );
  }

  Widget _buildFilterChips(ReservationsState state) {
    final activeFilter = switch (state) {
      ReservationsLoaded s => s.activeFilter,
      _ => null,
    };

    return Container(
      color: AppColors.white,
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Row(
          children: List.generate(_filters.length, (i) {
            final isActive = activeFilter == _filters[i];
            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: FilterChip(
                label: Text(_filterLabels[i]),
                selected: isActive,
                onSelected: (_) {
                  context.read<ReservationsBloc>().add(
                      LoadReservationsEvent(statusFilter: _filters[i]));
                },
                selectedColor: AppColors.primaryLight,
                checkmarkColor: AppColors.primary,
                labelStyle: AppTypography.labelSmall.copyWith(
                  color: isActive ? AppColors.primary : AppColors.grey500,
                ),
                backgroundColor: AppColors.grey100,
                side: BorderSide.none,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
            );
          }),
        ),
      ),
    );
  }

  Widget _buildBody(ReservationsState state) {
    return switch (state) {
      ReservationsInitial() || ReservationsLoading() => _buildShimmerList(),
      ReservationsError s => _buildError(s.message, () {
          context
              .read<ReservationsBloc>()
              .add(const LoadReservationsEvent());
        }),
      ReservationsLoaded s => s.reservations.isEmpty
          ? TransactionEmptyState(
              icon: Icons.hotel_rounded,
              title: 'No reservations yet',
              subtitle: 'Find a place to stay and make a reservation',
              ctaLabel: 'Explore Merchants',
              onCtaTap: () {},
            )
          : RefreshIndicator(
              color: AppColors.primary,
              onRefresh: () async {
                context
                    .read<ReservationsBloc>()
                    .add(const RefreshReservationsEvent());
              },
              child: ListView.builder(
                controller: _scrollController,
                padding: const EdgeInsets.all(16),
                itemCount:
                    s.reservations.length + (s.hasMore ? 1 : 0),
                itemBuilder: (context, index) {
                  if (index >= s.reservations.length) {
                    return const Padding(
                      padding: EdgeInsets.all(16),
                      child: Center(
                        child: CircularProgressIndicator(
                            color: AppColors.primary),
                      ),
                    );
                  }
                  return _buildReservationCard(s.reservations[index]);
                },
              ),
            ),
      ReservationCancelling s => RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () async {
            context
                .read<ReservationsBloc>()
                .add(const RefreshReservationsEvent());
          },
          child: ListView.builder(
            controller: _scrollController,
            padding: const EdgeInsets.all(16),
            itemCount: s.reservations.length,
            itemBuilder: (context, index) {
              final reservation = s.reservations[index];
              return Stack(
                children: [
                  _buildReservationCard(reservation),
                  if (reservation.id == s.cancellingId)
                    Positioned.fill(
                      child: Container(
                        decoration: BoxDecoration(
                          color: AppColors.white.withAlpha(180),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Center(
                          child: CircularProgressIndicator(
                              color: AppColors.primary),
                        ),
                      ),
                    ),
                ],
              );
            },
          ),
        ),
    };
  }

  Widget _buildReservationCard(ReservationEntity reservation) {
    return GestureDetector(
      onTap: () => _showReservationDetail(reservation),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: AppColors.grey900.withAlpha(6),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: AppColors.primaryLight,
                borderRadius: BorderRadius.circular(12),
              ),
              child: reservation.merchantLogo != null
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.network(reservation.merchantLogo!,
                          fit: BoxFit.cover,
                          width: 48,
                          height: 48,
                          errorBuilder: (_, e, s) => const Icon(
                              Icons.hotel_rounded,
                              color: AppColors.primary,
                              size: 24)),
                    )
                  : const Icon(Icons.hotel_rounded,
                      color: AppColors.primary, size: 24),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(reservation.merchantName ?? 'Reservation',
                      style: AppTypography.titleSmall),
                  const SizedBox(height: 2),
                  Text(
                    '${reservation.unitName ?? reservation.serviceName ?? ''} \u00B7 ${_formatDate(reservation.checkIn)} - ${_formatDate(reservation.checkOut)}',
                    style: AppTypography.bodySmall,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      StatusChip(status: reservation.status),
                      const Spacer(),
                      Text(
                        '\u20B1${reservation.totalAmount}',
                        style: AppTypography.titleSmall
                            .copyWith(color: AppColors.primary),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showReservationDetail(ReservationEntity reservation) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        maxChildSize: 0.9,
        minChildSize: 0.5,
        builder: (_, controller) {
          final authState = context.read<AuthBloc>().state;
          final userId = authState is AuthAuthenticated ? authState.user.id : 0;
          return ReservationDetailSheet(
            reservation: reservation,
            currentUserId: userId,
            onCancel: () {
              Navigator.pop(context);
              context
                  .read<ReservationsBloc>()
                  .add(CancelReservationEvent(reservation.id));
            },
          );
        },
      ),
    );
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('MMM d').format(date);
    } catch (_) {
      return dateStr;
    }
  }
}

// ---------------------------------------------------------------------------
// Orders Tab
// ---------------------------------------------------------------------------

class _OrdersTab extends StatefulWidget {
  const _OrdersTab();

  @override
  State<_OrdersTab> createState() => _OrdersTabState();
}

class _OrdersTabState extends State<_OrdersTab>
    with AutomaticKeepAliveClientMixin {
  final _scrollController = ScrollController();

  static const _filters = <String?>[
    null,
    'pending',
    'received',
    'processing',
    'ready',
    'delivering',
    'completed',
    'cancelled',
  ];

  static const _filterLabels = [
    'All',
    'Pending',
    'Received',
    'Processing',
    'Ready',
    'Delivering',
    'Completed',
    'Cancelled',
  ];

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    context.read<OrdersBloc>().add(const LoadOrdersEvent());
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      context.read<OrdersBloc>().add(const LoadMoreOrdersEvent());
    }
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return BlocBuilder<OrdersBloc, OrdersState>(
      builder: (context, state) {
        return Column(
          children: [
            _buildFilterChips(state),
            Expanded(child: _buildBody(state)),
          ],
        );
      },
    );
  }

  Widget _buildFilterChips(OrdersState state) {
    final activeFilter = switch (state) {
      OrdersLoaded s => s.activeFilter,
      _ => null,
    };

    return Container(
      color: AppColors.white,
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Row(
          children: List.generate(_filters.length, (i) {
            final isActive = activeFilter == _filters[i];
            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: FilterChip(
                label: Text(_filterLabels[i]),
                selected: isActive,
                onSelected: (_) {
                  context
                      .read<OrdersBloc>()
                      .add(LoadOrdersEvent(statusFilter: _filters[i]));
                },
                selectedColor: AppColors.primaryLight,
                checkmarkColor: AppColors.primary,
                labelStyle: AppTypography.labelSmall.copyWith(
                  color: isActive ? AppColors.primary : AppColors.grey500,
                ),
                backgroundColor: AppColors.grey100,
                side: BorderSide.none,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
            );
          }),
        ),
      ),
    );
  }

  Widget _buildBody(OrdersState state) {
    return switch (state) {
      OrdersInitial() || OrdersLoading() => _buildShimmerList(),
      OrdersError s => _buildError(s.message, () {
          context.read<OrdersBloc>().add(const LoadOrdersEvent());
        }),
      OrdersLoaded s => s.orders.isEmpty
          ? TransactionEmptyState(
              icon: Icons.shopping_bag_rounded,
              title: 'No orders yet',
              subtitle: 'Browse products and place your first order',
              ctaLabel: 'Explore Merchants',
              onCtaTap: () {},
            )
          : RefreshIndicator(
              color: AppColors.primary,
              onRefresh: () async {
                context
                    .read<OrdersBloc>()
                    .add(const RefreshOrdersEvent());
              },
              child: ListView.builder(
                controller: _scrollController,
                padding: const EdgeInsets.all(16),
                itemCount: s.orders.length + (s.hasMore ? 1 : 0),
                itemBuilder: (context, index) {
                  if (index >= s.orders.length) {
                    return const Padding(
                      padding: EdgeInsets.all(16),
                      child: Center(
                        child: CircularProgressIndicator(
                            color: AppColors.primary),
                      ),
                    );
                  }
                  return _buildOrderCard(s.orders[index]);
                },
              ),
            ),
      OrderCancelling s => RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () async {
            context.read<OrdersBloc>().add(const RefreshOrdersEvent());
          },
          child: ListView.builder(
            controller: _scrollController,
            padding: const EdgeInsets.all(16),
            itemCount: s.orders.length,
            itemBuilder: (context, index) {
              final order = s.orders[index];
              return Stack(
                children: [
                  _buildOrderCard(order),
                  if (order.id == s.cancellingId)
                    Positioned.fill(
                      child: Container(
                        decoration: BoxDecoration(
                          color: AppColors.white.withAlpha(180),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Center(
                          child: CircularProgressIndicator(
                              color: AppColors.primary),
                        ),
                      ),
                    ),
                ],
              );
            },
          ),
        ),
    };
  }

  Widget _buildOrderCard(ServiceOrderEntity order) {
    return GestureDetector(
      onTap: () => _showOrderDetail(order),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: AppColors.grey900.withAlpha(6),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: AppColors.primaryLight,
                borderRadius: BorderRadius.circular(12),
              ),
              child: order.merchantLogo != null
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.network(order.merchantLogo!,
                          fit: BoxFit.cover,
                          width: 48,
                          height: 48,
                          errorBuilder: (_, e, s) => const Icon(
                              Icons.shopping_bag_rounded,
                              color: AppColors.primary,
                              size: 24)),
                    )
                  : const Icon(Icons.shopping_bag_rounded,
                      color: AppColors.primary, size: 24),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(order.merchantName ?? 'Order',
                      style: AppTypography.titleSmall),
                  const SizedBox(height: 2),
                  Text(
                    '${order.orderNumber} \u00B7 ${order.serviceName ?? ''}',
                    style: AppTypography.bodySmall,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      StatusChip(status: order.status),
                      const Spacer(),
                      Text(
                        '\u20B1${order.totalAmount}',
                        style: AppTypography.titleSmall
                            .copyWith(color: AppColors.primary),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showOrderDetail(ServiceOrderEntity order) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        maxChildSize: 0.9,
        minChildSize: 0.5,
        builder: (_, controller) {
          final authState = context.read<AuthBloc>().state;
          final userId = authState is AuthAuthenticated ? authState.user.id : 0;
          return OrderDetailSheet(
            order: order,
            currentUserId: userId,
            onCancel: () {
              Navigator.pop(context);
              context.read<OrdersBloc>().add(CancelOrderEvent(order.id));
            },
          );
        },
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

Widget _buildShimmerList() {
  return ListView.builder(
    padding: const EdgeInsets.all(16),
    itemCount: 5,
    itemBuilder: (_, i) => Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: ShimmerLoading.wrap(
        child: Container(
          height: 88,
          decoration: BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(
            children: [
              const SizedBox(width: 16),
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppColors.grey200,
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      height: 14,
                      width: 120,
                      decoration: BoxDecoration(
                        color: AppColors.grey200,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      height: 12,
                      width: 180,
                      decoration: BoxDecoration(
                        color: AppColors.grey200,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Container(
                          height: 22,
                          width: 60,
                          decoration: BoxDecoration(
                            color: AppColors.grey200,
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        const Spacer(),
                        Container(
                          height: 14,
                          width: 50,
                          decoration: BoxDecoration(
                            color: AppColors.grey200,
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                        const SizedBox(width: 16),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

Widget _buildError(String message, VoidCallback onRetry) {
  return Center(
    child: Padding(
      padding: const EdgeInsets.all(40),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.error_outline_rounded,
              size: 48, color: AppColors.error),
          const SizedBox(height: 16),
          Text(
            message,
            style: AppTypography.bodyMedium.copyWith(color: AppColors.grey700),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: onRetry,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: AppColors.white,
            ),
            child: const Text('Retry'),
          ),
        ],
      ),
    ),
  );
}
