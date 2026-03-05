import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../bloc/merchant_list/merchant_list_bloc.dart';
import '../bloc/merchant_list/merchant_list_event.dart';
import '../bloc/merchant_list/merchant_list_state.dart';

class SearchBarWidget extends StatefulWidget {
  const SearchBarWidget({super.key});

  @override
  State<SearchBarWidget> createState() => _SearchBarWidgetState();
}

class _SearchBarWidgetState extends State<SearchBarWidget>
    with SingleTickerProviderStateMixin {
  final _controller = TextEditingController();
  final _focusNode = FocusNode();
  Timer? _debounce;
  bool _isFocused = false;
  int _selectedCategoryIndex = 0;

  static const _categories = ['All', 'Booking', 'Shopping', 'Rentals'];

  late final AnimationController _bounceController;
  late final Animation<double> _bounceAnimation;

  @override
  void initState() {
    super.initState();
    _focusNode.addListener(_onFocusChange);
    _bounceController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    _bounceAnimation = TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 1.2), weight: 25),
      TweenSequenceItem(tween: Tween(begin: 1.2, end: 0.9), weight: 25),
      TweenSequenceItem(tween: Tween(begin: 0.9, end: 1.05), weight: 25),
      TweenSequenceItem(tween: Tween(begin: 1.05, end: 1.0), weight: 25),
    ]).animate(CurvedAnimation(
      parent: _bounceController,
      curve: Curves.easeInOut,
    ));
  }

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    _debounce?.cancel();
    _bounceController.dispose();
    super.dispose();
  }

  void _onFocusChange() {
    setState(() => _isFocused = _focusNode.hasFocus);
    if (_focusNode.hasFocus) {
      _bounceController.forward(from: 0);
    }
  }

  void _onSearchChanged(String query) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), () {
      if (mounted) {
        context.read<MerchantListBloc>().add(SearchMerchantsEvent(query));
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Floating search bar
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 0),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            decoration: BoxDecoration(
              color: AppColors.white,
              borderRadius: BorderRadius.circular(28),
              boxShadow: [
                BoxShadow(
                  color: _isFocused
                      ? AppColors.primary.withAlpha(25)
                      : AppColors.grey900.withAlpha(10),
                  blurRadius: _isFocused ? 16 : 12,
                  offset: const Offset(0, 4),
                  spreadRadius: _isFocused ? 2 : 0,
                ),
              ],
              border: Border.all(
                color: _isFocused
                    ? AppColors.primary.withAlpha(60)
                    : Colors.transparent,
                width: 1.5,
              ),
            ),
            child: TextField(
              controller: _controller,
              focusNode: _focusNode,
              decoration: InputDecoration(
                hintText: 'Search merchants, services...',
                hintStyle: AppTypography.bodyMedium.copyWith(
                  color: AppColors.grey400,
                ),
                prefixIcon: Padding(
                  padding: const EdgeInsets.only(left: 16, right: 8),
                  child: AnimatedBuilder(
                    animation: _bounceAnimation,
                    builder: (context, child) {
                      return Transform.scale(
                        scale: _bounceAnimation.value,
                        child: child,
                      );
                    },
                    child: const Icon(
                      Icons.search_rounded,
                      color: AppColors.grey400,
                      size: 22,
                    ),
                  ),
                ),
                prefixIconConstraints: const BoxConstraints(
                  minWidth: 46,
                  minHeight: 22,
                ),
                suffixIcon: _controller.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear_rounded,
                            color: AppColors.grey400, size: 20),
                        onPressed: () {
                          _controller.clear();
                          _onSearchChanged('');
                          setState(() {});
                        },
                      )
                    : null,
                filled: false,
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 0,
                  vertical: 14,
                ),
              ),
              style: AppTypography.bodyMedium,
              onChanged: (value) {
                _onSearchChanged(value);
                setState(() {}); // for clear button
              },
            ),
          ),
        ),
        const SizedBox(height: 12),

        // Location chip + category chips row
        SizedBox(
          height: 38,
          child: BlocBuilder<MerchantListBloc, MerchantListState>(
            builder: (context, state) {
              final isLocationFiltered =
                  state is MerchantListLoaded && state.isLocationFiltered;
              return ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: [
                  // Near Me chip
                  _buildNearMeChip(isLocationFiltered),
                  if (isLocationFiltered) ...[
                    const SizedBox(width: 8),
                    _buildClearChip(),
                  ],
                  const SizedBox(width: 8),
                  // Divider
                  Container(
                    width: 1,
                    margin: const EdgeInsets.symmetric(vertical: 6),
                    color: AppColors.grey200,
                  ),
                  const SizedBox(width: 8),
                  // Category chips
                  ...List.generate(_categories.length, (index) {
                    return Padding(
                      padding: EdgeInsets.only(
                          right: index < _categories.length - 1 ? 8 : 0),
                      child: _buildCategoryChip(index),
                    );
                  }),
                ],
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildNearMeChip(bool isActive) {
    return GestureDetector(
      onTap: () => context
          .read<MerchantListBloc>()
          .add(const FilterByLocationEvent()),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeInOut,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isActive ? AppColors.primary : AppColors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isActive ? AppColors.primary : AppColors.grey300,
            width: 1.2,
          ),
          boxShadow: isActive
              ? [
                  BoxShadow(
                    color: AppColors.primary.withAlpha(40),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.near_me_rounded,
              size: 14,
              color: isActive ? AppColors.white : AppColors.grey600,
            ),
            const SizedBox(width: 5),
            Text(
              'Near Me',
              style: AppTypography.labelSmall.copyWith(
                color: isActive ? AppColors.white : AppColors.grey600,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildClearChip() {
    return GestureDetector(
      onTap: () => context
          .read<MerchantListBloc>()
          .add(const ClearLocationFilterEvent()),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: AppColors.grey100,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.grey300),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.clear_rounded,
                size: 14, color: AppColors.grey600),
            const SizedBox(width: 4),
            Text(
              'Clear',
              style: AppTypography.labelSmall.copyWith(
                color: AppColors.grey600,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCategoryChip(int index) {
    final isSelected = _selectedCategoryIndex == index;
    return GestureDetector(
      onTap: () {
        setState(() => _selectedCategoryIndex = index);
        // Category filtering is visual-only for now
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : AppColors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.grey300,
            width: 1.2,
          ),
        ),
        child: Text(
          _categories[index],
          style: AppTypography.labelSmall.copyWith(
            color: isSelected ? AppColors.white : AppColors.grey600,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}
