import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';

class MainShell extends StatelessWidget {
  final Widget child;
  const MainShell({super.key, required this.child});

  static const List<_TabItem> _tabs = [
    _TabItem(label: 'Explore', icon: Icons.search_outlined, activeIcon: Icons.search, route: '/explore'),
    _TabItem(label: 'Transactions', icon: Icons.receipt_long_outlined, activeIcon: Icons.receipt_long, route: '/transactions'),
    _TabItem(label: 'Rewards', icon: Icons.star_outline, activeIcon: Icons.star, route: '/rewards'),
    _TabItem(label: 'Me', icon: Icons.person_outline, activeIcon: Icons.person, route: '/me'),
  ];

  int _currentIndex(String location) {
    if (location.startsWith('/transactions')) return 1;
    if (location.startsWith('/rewards')) return 2;
    if (location.startsWith('/me')) return 3;
    return 0; // default to explore
  }

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).uri.toString();
    final currentIndex = _currentIndex(location);

    return Scaffold(
      body: child,
      bottomNavigationBar: _FloatingBottomNav(
        currentIndex: currentIndex,
        tabs: _tabs,
        onTap: (index) {
          HapticFeedback.selectionClick();
          context.go(_tabs[index].route);
        },
      ),
    );
  }
}

class _FloatingBottomNav extends StatelessWidget {
  final int currentIndex;
  final List<_TabItem> tabs;
  final ValueChanged<int> onTap;

  const _FloatingBottomNav({
    required this.currentIndex,
    required this.tabs,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppColors.grey900.withValues(alpha: 0.08),
            blurRadius: 24,
            offset: const Offset(0, -2),
          ),
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, -1),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: List.generate(tabs.length, (index) {
              return _NavItem(
                tab: tabs[index],
                isSelected: currentIndex == index,
                onTap: () => onTap(index),
              );
            }),
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatefulWidget {
  final _TabItem tab;
  final bool isSelected;
  final VoidCallback onTap;

  const _NavItem({
    required this.tab,
    required this.isSelected,
    required this.onTap,
  });

  @override
  State<_NavItem> createState() => _NavItemState();
}

class _NavItemState extends State<_NavItem>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 250),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 1.15).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutBack),
    );
    if (widget.isSelected) {
      _controller.value = 1.0;
    }
  }

  @override
  void didUpdateWidget(covariant _NavItem oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isSelected && !oldWidget.isSelected) {
      _controller.forward(from: 0.0);
    } else if (!widget.isSelected && oldWidget.isSelected) {
      _controller.reverse();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
        padding: EdgeInsets.symmetric(
          horizontal: widget.isSelected ? 16 : 12,
          vertical: 8,
        ),
        decoration: BoxDecoration(
          color: widget.isSelected
              ? AppColors.primaryLight
              : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ScaleTransition(
              scale: _scaleAnimation,
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 200),
                child: Icon(
                  widget.isSelected ? widget.tab.activeIcon : widget.tab.icon,
                  key: ValueKey(widget.isSelected),
                  color: widget.isSelected
                      ? AppColors.primary
                      : AppColors.grey400,
                  size: 24,
                ),
              ),
            ),
            const SizedBox(height: 4),
            AnimatedDefaultTextStyle(
              duration: const Duration(milliseconds: 200),
              style: AppTypography.labelSmall.copyWith(
                color: widget.isSelected
                    ? AppColors.primary
                    : AppColors.grey400,
                fontWeight: widget.isSelected
                    ? FontWeight.w700
                    : FontWeight.w500,
                fontSize: 10,
              ),
              child: Text(widget.tab.label),
            ),
            // Animated pill indicator
            const SizedBox(height: 2),
            AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              curve: Curves.easeOut,
              width: widget.isSelected ? 20 : 0,
              height: 3,
              decoration: BoxDecoration(
                color: widget.isSelected
                    ? AppColors.primary
                    : Colors.transparent,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TabItem {
  final String label;
  final IconData icon;
  final IconData activeIcon;
  final String route;
  const _TabItem({required this.label, required this.icon, required this.activeIcon, required this.route});
}
