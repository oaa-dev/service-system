import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

class AppTypography {
  AppTypography._();

  static TextStyle get displayLarge => GoogleFonts.bricolageGrotesque(
        fontSize: 57,
        fontWeight: FontWeight.w700,
        color: AppColors.grey900,
        letterSpacing: -0.25,
        height: 1.12,
      );

  static TextStyle get displayMedium => GoogleFonts.bricolageGrotesque(
        fontSize: 45,
        fontWeight: FontWeight.w700,
        color: AppColors.grey900,
        letterSpacing: -0.15,
        height: 1.16,
      );

  static TextStyle get displaySmall => GoogleFonts.bricolageGrotesque(
        fontSize: 36,
        fontWeight: FontWeight.w600,
        color: AppColors.grey900,
        letterSpacing: -0.1,
        height: 1.2,
      );

  static TextStyle get headlineLarge => GoogleFonts.bricolageGrotesque(
        fontSize: 32,
        fontWeight: FontWeight.w600,
        color: AppColors.grey900,
        letterSpacing: -0.2,
        height: 1.2,
      );

  static TextStyle get headlineMedium => GoogleFonts.bricolageGrotesque(
        fontSize: 28,
        fontWeight: FontWeight.w600,
        color: AppColors.grey900,
        letterSpacing: -0.3,
        height: 1.2,
      );

  static TextStyle get headlineSmall => GoogleFonts.bricolageGrotesque(
        fontSize: 24,
        fontWeight: FontWeight.w600,
        color: AppColors.grey900,
        letterSpacing: -0.25,
        height: 1.2,
      );

  static TextStyle get titleLarge => GoogleFonts.dmSans(
        fontSize: 22,
        fontWeight: FontWeight.w600,
        color: AppColors.grey900,
        height: 1.27,
      );

  static TextStyle get titleMedium => GoogleFonts.dmSans(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: AppColors.grey900,
        letterSpacing: 0.15,
        height: 1.3,
      );

  static TextStyle get titleSmall => GoogleFonts.dmSans(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: AppColors.grey900,
        letterSpacing: 0.1,
        height: 1.3,
      );

  static TextStyle get bodyLarge => GoogleFonts.dmSans(
        fontSize: 16,
        fontWeight: FontWeight.w400,
        color: AppColors.grey700,
        height: 1.5,
      );

  static TextStyle get bodyMedium => GoogleFonts.dmSans(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        color: AppColors.grey700,
        letterSpacing: 0.25,
        height: 1.5,
      );

  static TextStyle get bodySmall => GoogleFonts.dmSans(
        fontSize: 12,
        fontWeight: FontWeight.w400,
        color: AppColors.grey500,
        letterSpacing: 0.4,
        height: 1.5,
      );

  static TextStyle get labelLarge => GoogleFonts.dmSans(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: AppColors.grey700,
        letterSpacing: 0.1,
        height: 1.4,
      );

  static TextStyle get labelMedium => GoogleFonts.dmSans(
        fontSize: 12,
        fontWeight: FontWeight.w600,
        color: AppColors.grey600,
        letterSpacing: 0.5,
        height: 1.4,
      );

  static TextStyle get labelSmall => GoogleFonts.dmSans(
        fontSize: 11,
        fontWeight: FontWeight.w500,
        color: AppColors.grey500,
        letterSpacing: 0.5,
        height: 1.4,
      );

  static TextTheme get textTheme => TextTheme(
        displayLarge: displayLarge,
        displayMedium: displayMedium,
        displaySmall: displaySmall,
        headlineLarge: headlineLarge,
        headlineMedium: headlineMedium,
        headlineSmall: headlineSmall,
        titleLarge: titleLarge,
        titleMedium: titleMedium,
        titleSmall: titleSmall,
        bodyLarge: bodyLarge,
        bodyMedium: bodyMedium,
        bodySmall: bodySmall,
        labelLarge: labelLarge,
        labelMedium: labelMedium,
        labelSmall: labelSmall,
      );
}
