import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../bloc/favorites_bloc.dart';
import '../bloc/favorites_event.dart';

class FavoriteButton extends StatelessWidget {
  final int merchantId;
  final bool isFavorited;
  final double size;

  const FavoriteButton({
    super.key,
    required this.merchantId,
    required this.isFavorited,
    this.size = 24,
  });

  @override
  Widget build(BuildContext context) {
    return IconButton(
      icon: Icon(
        isFavorited ? Icons.favorite : Icons.favorite_border,
        color: isFavorited ? Colors.red : null,
        size: size,
      ),
      onPressed: () {
        HapticFeedback.mediumImpact();
        context
            .read<FavoritesBloc>()
            .add(ToggleFavoriteEvent(merchantId, isFavorited));
      },
    );
  }
}
