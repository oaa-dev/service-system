import 'package:flutter/material.dart';
import 'package:flutter_rating_bar/flutter_rating_bar.dart';

class StarRatingInput extends StatelessWidget {
  final double initialRating;
  final ValueChanged<double> onRatingUpdate;
  final double size;

  const StarRatingInput({
    super.key,
    required this.initialRating,
    required this.onRatingUpdate,
    this.size = 36,
  });

  @override
  Widget build(BuildContext context) {
    return RatingBar.builder(
      initialRating: initialRating,
      minRating: 1,
      itemCount: 5,
      itemSize: size,
      itemBuilder: (context, _) => const Icon(Icons.star, color: Colors.amber),
      onRatingUpdate: onRatingUpdate,
    );
  }
}
