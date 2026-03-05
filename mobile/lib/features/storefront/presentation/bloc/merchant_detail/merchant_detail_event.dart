import 'package:equatable/equatable.dart';

abstract class MerchantDetailEvent extends Equatable {
  const MerchantDetailEvent();

  @override
  List<Object?> get props => [];
}

class LoadMerchantDetailEvent extends MerchantDetailEvent {
  final String slug;

  const LoadMerchantDetailEvent(this.slug);

  @override
  List<Object?> get props => [slug];
}
