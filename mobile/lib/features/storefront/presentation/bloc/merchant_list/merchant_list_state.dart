import 'package:equatable/equatable.dart';
import '../../../domain/entities/merchant_entity.dart';

abstract class MerchantListState extends Equatable {
  const MerchantListState();

  @override
  List<Object?> get props => [];
}

class MerchantListInitial extends MerchantListState {
  const MerchantListInitial();
}

class MerchantListLoading extends MerchantListState {
  const MerchantListLoading();
}

class MerchantListLoaded extends MerchantListState {
  final List<MerchantEntity> merchants;
  final bool hasMore;
  final int currentPage;
  final bool isLocationFiltered;

  const MerchantListLoaded({
    required this.merchants,
    required this.hasMore,
    required this.currentPage,
    this.isLocationFiltered = false,
  });

  @override
  List<Object?> get props => [merchants, hasMore, currentPage, isLocationFiltered];
}

class MerchantListLoadingMore extends MerchantListLoaded {
  const MerchantListLoadingMore({
    required super.merchants,
    required super.hasMore,
    required super.currentPage,
    super.isLocationFiltered,
  });
}

class MerchantListError extends MerchantListState {
  final String message;

  const MerchantListError(this.message);

  @override
  List<Object?> get props => [message];
}
