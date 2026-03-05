import 'package:equatable/equatable.dart';

abstract class MerchantListEvent extends Equatable {
  const MerchantListEvent();

  @override
  List<Object?> get props => [];
}

class LoadMerchantsEvent extends MerchantListEvent {
  const LoadMerchantsEvent();
}

class SearchMerchantsEvent extends MerchantListEvent {
  final String query;

  const SearchMerchantsEvent(this.query);

  @override
  List<Object?> get props => [query];
}

class FilterByLocationEvent extends MerchantListEvent {
  const FilterByLocationEvent();
}

class LoadMoreMerchantsEvent extends MerchantListEvent {
  const LoadMoreMerchantsEvent();
}

class ClearLocationFilterEvent extends MerchantListEvent {
  const ClearLocationFilterEvent();
}
