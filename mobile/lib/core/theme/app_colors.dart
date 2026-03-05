import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // Brand — warm indigo-violet
  static const Color primary = Color(0xFF6C5CE7);       // Indigo-violet
  static const Color primaryLight = Color(0xFFF0EDFF);   // Soft lavender tint
  static const Color primaryDark = Color(0xFF5A4BD1);    // Deep indigo

  // Secondary
  static const Color secondary = Color(0xFF7C3AED);     // Violet-600
  static const Color secondaryLight = Color(0xFFF5F3FF);

  // Accent — coral/salmon for highlights
  static const Color accent = Color(0xFFFF6B6B);
  static const Color accentLight = Color(0xFFFFF0F0);

  // Gold — star ratings, premium badges
  static const Color gold = Color(0xFFFFB800);
  static const Color goldLight = Color(0xFFFFF8E1);

  // Semantic
  static const Color success = Color(0xFF00B894);       // Teal-green (warmer)
  static const Color successLight = Color(0xFFE6FBF5);
  static const Color warning = Color(0xFFF39C12);       // Warm amber
  static const Color warningLight = Color(0xFFFFF8E8);
  static const Color error = Color(0xFFE74C3C);         // Warm red
  static const Color errorLight = Color(0xFFFDF0EE);

  // Neutrals — warm-toned greys
  static const Color grey50 = Color(0xFFFAF9F7);
  static const Color grey100 = Color(0xFFF5F3F0);
  static const Color grey200 = Color(0xFFE8E5E1);
  static const Color grey300 = Color(0xFFD5D1CC);
  static const Color grey400 = Color(0xFFA8A29E);
  static const Color grey500 = Color(0xFF78716C);
  static const Color grey600 = Color(0xFF57534E);
  static const Color grey700 = Color(0xFF3C3836);
  static const Color grey800 = Color(0xFF292524);
  static const Color grey900 = Color(0xFF1C1917);

  // Surface — warm whites
  static const Color white = Color(0xFFFFFFFF);
  static const Color surface = Color(0xFFFAF9F7);        // Warm off-white
  static const Color surfaceVariant = Color(0xFFF0EDFF);  // Lavender tint

  // Gradients (use with BoxDecoration)
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [primary, primaryDark],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient accentGradient = LinearGradient(
    colors: [Color(0xFFFF6B6B), Color(0xFFFF8E8E)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient warmGradient = LinearGradient(
    colors: [Color(0xFF6C5CE7), Color(0xFFFF6B6B)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}
