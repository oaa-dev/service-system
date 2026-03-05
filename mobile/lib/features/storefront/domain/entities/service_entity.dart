import 'package:equatable/equatable.dart';

class ServiceEntity extends Equatable {
  final int id;
  final String name;
  final String slug;
  final String? description;
  final String price;
  final bool isActive;
  final bool isBookable;
  final bool isSellable;
  final int? duration;
  final String? imageUrl;

  const ServiceEntity({
    required this.id,
    required this.name,
    required this.slug,
    this.description,
    required this.price,
    required this.isActive,
    required this.isBookable,
    required this.isSellable,
    this.duration,
    this.imageUrl,
  });

  @override
  List<Object?> get props => [
        id,
        name,
        slug,
        description,
        price,
        isActive,
        isBookable,
        isSellable,
        duration,
        imageUrl,
      ];
}
