import 'package:equatable/equatable.dart';

class PaymentMethodEntity extends Equatable {
  final int id;
  final String name;
  final String slug;
  final bool isActive;

  const PaymentMethodEntity({
    required this.id,
    required this.name,
    required this.slug,
    required this.isActive,
  });

  @override
  List<Object?> get props => [id, name, slug, isActive];
}
