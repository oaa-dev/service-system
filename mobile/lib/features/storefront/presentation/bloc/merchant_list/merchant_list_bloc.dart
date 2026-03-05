import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';
import '../../../data/datasources/storefront_remote_data_source.dart';
import '../../../domain/usecases/get_merchants_use_case.dart';
import 'merchant_list_event.dart';
import 'merchant_list_state.dart';

@injectable
class MerchantListBloc extends Bloc<MerchantListEvent, MerchantListState> {
  final GetMerchantsUseCase _getMerchants;
  final StorefrontRemoteDataSource _dataSource;

  String _currentQuery = '';
  double? _currentLat;
  double? _currentLng;
  static const double _defaultRadius = 10.0;

  MerchantListBloc(this._getMerchants, this._dataSource)
      : super(const MerchantListInitial()) {
    on<LoadMerchantsEvent>(_onLoadMerchants);
    on<SearchMerchantsEvent>(_onSearchMerchants);
    on<FilterByLocationEvent>(_onFilterByLocation);
    on<LoadMoreMerchantsEvent>(_onLoadMore);
    on<ClearLocationFilterEvent>(_onClearLocationFilter);
  }

  Future<void> _onLoadMerchants(
    LoadMerchantsEvent event,
    Emitter<MerchantListState> emit,
  ) async {
    emit(const MerchantListLoading());
    _currentQuery = '';
    _currentLat = null;
    _currentLng = null;

    final result = await _getMerchants(page: 1);
    result.fold(
      (failure) => emit(MerchantListError(failure.message)),
      (data) => emit(MerchantListLoaded(
        merchants: data.merchants,
        hasMore: data.hasMore,
        currentPage: data.currentPage,
        isLocationFiltered: false,
      )),
    );
  }

  Future<void> _onSearchMerchants(
    SearchMerchantsEvent event,
    Emitter<MerchantListState> emit,
  ) async {
    _currentQuery = event.query;
    emit(const MerchantListLoading());

    final result = await _getMerchants(
      query: _currentQuery.isEmpty ? null : _currentQuery,
      lat: _currentLat,
      lng: _currentLng,
      radius: (_currentLat != null) ? _defaultRadius : null,
      page: 1,
    );
    result.fold(
      (failure) => emit(MerchantListError(failure.message)),
      (data) => emit(MerchantListLoaded(
        merchants: data.merchants,
        hasMore: data.hasMore,
        currentPage: data.currentPage,
        isLocationFiltered: _currentLat != null,
      )),
    );
  }

  Future<void> _onFilterByLocation(
    FilterByLocationEvent event,
    Emitter<MerchantListState> emit,
  ) async {
    emit(const MerchantListLoading());

    final positionResult = await _dataSource.getCurrentPosition();
    await positionResult.fold(
      (failure) async => emit(MerchantListError(failure.message)),
      (position) async {
        _currentLat = position.latitude;
        _currentLng = position.longitude;

        final result = await _getMerchants(
          query: _currentQuery.isEmpty ? null : _currentQuery,
          lat: _currentLat,
          lng: _currentLng,
          radius: _defaultRadius,
          page: 1,
        );
        result.fold(
          (failure) => emit(MerchantListError(failure.message)),
          (data) => emit(MerchantListLoaded(
            merchants: data.merchants,
            hasMore: data.hasMore,
            currentPage: data.currentPage,
            isLocationFiltered: true,
          )),
        );
      },
    );
  }

  Future<void> _onLoadMore(
    LoadMoreMerchantsEvent event,
    Emitter<MerchantListState> emit,
  ) async {
    final currentState = state;
    if (currentState is! MerchantListLoaded || !currentState.hasMore) return;
    if (currentState is MerchantListLoadingMore) return;

    emit(MerchantListLoadingMore(
      merchants: currentState.merchants,
      hasMore: currentState.hasMore,
      currentPage: currentState.currentPage,
      isLocationFiltered: currentState.isLocationFiltered,
    ));

    final nextPage = currentState.currentPage + 1;
    final result = await _getMerchants(
      query: _currentQuery.isEmpty ? null : _currentQuery,
      lat: _currentLat,
      lng: _currentLng,
      radius: (_currentLat != null) ? _defaultRadius : null,
      page: nextPage,
    );
    result.fold(
      (failure) => emit(MerchantListError(failure.message)),
      (data) => emit(MerchantListLoaded(
        merchants: [...currentState.merchants, ...data.merchants],
        hasMore: data.hasMore,
        currentPage: data.currentPage,
        isLocationFiltered: currentState.isLocationFiltered,
      )),
    );
  }

  Future<void> _onClearLocationFilter(
    ClearLocationFilterEvent event,
    Emitter<MerchantListState> emit,
  ) async {
    _currentLat = null;
    _currentLng = null;
    emit(const MerchantListLoading());

    final result = await _getMerchants(
      query: _currentQuery.isEmpty ? null : _currentQuery,
      page: 1,
    );
    result.fold(
      (failure) => emit(MerchantListError(failure.message)),
      (data) => emit(MerchantListLoaded(
        merchants: data.merchants,
        hasMore: data.hasMore,
        currentPage: data.currentPage,
        isLocationFiltered: false,
      )),
    );
  }
}
