import 'package:flutter/material.dart';
import 'app_colors.dart';
import 'app_typography.dart';

class AppTheme {
  AppTheme._();

  static ThemeData get light => ThemeData(
        useMaterial3: true,
        colorScheme: const ColorScheme.light(
          primary: AppColors.primary,
          onPrimary: AppColors.white,
          primaryContainer: AppColors.primaryLight,
          onPrimaryContainer: AppColors.primaryDark,
          secondary: AppColors.secondary,
          onSecondary: AppColors.white,
          tertiary: AppColors.accent,
          onTertiary: AppColors.white,
          error: AppColors.error,
          onError: AppColors.white,
          surface: AppColors.white,
          onSurface: AppColors.grey900,
          surfaceContainerHighest: AppColors.grey100,
          outline: AppColors.grey300,
        ),
        textTheme: AppTypography.textTheme,
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: AppColors.white,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 14,
          ),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: AppColors.grey200),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: AppColors.grey200),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: AppColors.primary, width: 2),
          ),
          errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: AppColors.error),
          ),
          focusedErrorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: AppColors.error, width: 2),
          ),
          labelStyle: AppTypography.bodyMedium,
          hintStyle: AppTypography.bodyMedium.copyWith(color: AppColors.grey400),
          errorStyle: AppTypography.bodySmall.copyWith(color: AppColors.error),
          floatingLabelStyle: AppTypography.labelMedium.copyWith(
            color: AppColors.primary,
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: AppColors.white,
            minimumSize: const Size(double.infinity, 52),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
            textStyle: AppTypography.labelLarge.copyWith(fontSize: 16),
            elevation: 0,
          ),
        ),
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.primary,
            minimumSize: const Size(double.infinity, 52),
            side: const BorderSide(color: AppColors.grey200, width: 1.5),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
            textStyle: AppTypography.labelLarge.copyWith(fontSize: 16),
          ),
        ),
        textButtonTheme: TextButtonThemeData(
          style: TextButton.styleFrom(
            foregroundColor: AppColors.primary,
            textStyle: AppTypography.labelLarge,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        ),
        cardTheme: CardThemeData(
          color: AppColors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          shadowColor: AppColors.grey900.withValues(alpha: 0.08),
          margin: const EdgeInsets.all(0),
        ),
        appBarTheme: AppBarTheme(
          backgroundColor: AppColors.white,
          foregroundColor: AppColors.grey900,
          elevation: 0,
          scrolledUnderElevation: 0.5,
          shadowColor: AppColors.grey900.withValues(alpha: 0.1),
          centerTitle: false,
          titleTextStyle: AppTypography.titleLarge,
        ),
        dividerTheme: const DividerThemeData(
          color: AppColors.grey200,
          thickness: 1,
        ),
        chipTheme: ChipThemeData(
          backgroundColor: AppColors.grey50,
          selectedColor: AppColors.primaryLight,
          labelStyle: AppTypography.labelMedium,
          shape: const StadiumBorder(),
          side: const BorderSide(color: AppColors.grey200),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        ),
        snackBarTheme: SnackBarThemeData(
          backgroundColor: AppColors.grey800,
          contentTextStyle: AppTypography.bodyMedium.copyWith(
            color: AppColors.white,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          behavior: SnackBarBehavior.floating,
          insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        ),
        navigationBarTheme: NavigationBarThemeData(
          backgroundColor: AppColors.white,
          indicatorColor: AppColors.primaryLight,
          labelTextStyle: WidgetStatePropertyAll(
            AppTypography.labelSmall.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          elevation: 0,
          height: 68,
        ),
        scaffoldBackgroundColor: AppColors.surface,
      );
}
