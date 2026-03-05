import 'package:equatable/equatable.dart';
import '../../../domain/entities/merchant_entity.dart';
import '../../../domain/entities/service_entity.dart';

abstract class MerchantDetailState extends Equatable {
  const MerchantDetailState();

  @override
  List<Object?> get props => [];
}

class MerchantDetailInitial extends MerchantDetailState {
  const MerchantDetailInitial();
}

class MerchantDetailLoading extends MerchantDetailState {
  const MerchantDetailLoading();
}

class MerchantDetailLoaded extends MerchantDetailState {
  final MerchantEntity merchant;
  final List<ServiceEntity> services;

  const MerchantDetailLoaded({
    required this.merchant,
    required this.services,
  });

  @override
  List<Object?> get props => [merchant, services];
}

class MerchantDetailError extends MerchantDetailState {
  final String message;

  const MerchantDetailError(this.message);

  @override
  List<Object?> get props => [message];
}
