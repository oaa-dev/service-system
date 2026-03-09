import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_typography.dart';

class DatePickerStep extends StatefulWidget {
  final DateTime? selectedDate;
  final ValueChanged<DateTime> onDateSelected;
  final DateTime? minDate;

  const DatePickerStep({
    super.key,
    this.selectedDate,
    required this.onDateSelected,
    this.minDate,
  });

  @override
  State<DatePickerStep> createState() => _DatePickerStepState();
}

class _DatePickerStepState extends State<DatePickerStep> {
  late DateTime _focusedMonth;
  final _today = DateTime.now();

  @override
  void initState() {
    super.initState();
    _focusedMonth = widget.selectedDate ?? _today;
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Select a Date',
            style: AppTypography.titleMedium.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Choose when you\'d like your appointment',
            style: AppTypography.bodySmall.copyWith(
              color: AppColors.grey500,
            ),
          ),
          const SizedBox(height: 20),
          _buildCalendar(),
        ],
      ),
    );
  }

  Widget _buildCalendar() {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.grey900.withAlpha(8),
            blurRadius: 12,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          _buildMonthNav(),
          const SizedBox(height: 16),
          _buildWeekHeaders(),
          const SizedBox(height: 8),
          _buildDayGrid(),
        ],
      ),
    );
  }

  Widget _buildMonthNav() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        IconButton(
          onPressed: _canGoBack
              ? () {
                  setState(() {
                    _focusedMonth = DateTime(
                        _focusedMonth.year, _focusedMonth.month - 1, 1);
                  });
                }
              : null,
          icon: Icon(
            Icons.chevron_left_rounded,
            color: _canGoBack ? AppColors.grey800 : AppColors.grey300,
          ),
        ),
        Text(
          DateFormat.yMMMM().format(_focusedMonth),
          style: AppTypography.titleSmall.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
        IconButton(
          onPressed: () {
            setState(() {
              _focusedMonth = DateTime(
                  _focusedMonth.year, _focusedMonth.month + 1, 1);
            });
          },
          icon: const Icon(Icons.chevron_right_rounded, color: AppColors.grey800),
        ),
      ],
    );
  }

  bool get _canGoBack {
    final prevMonth = DateTime(_focusedMonth.year, _focusedMonth.month - 1);
    return prevMonth.year > _today.year ||
        (prevMonth.year == _today.year && prevMonth.month >= _today.month);
  }

  Widget _buildWeekHeaders() {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return Row(
      children: days
          .map((d) => Expanded(
                child: Center(
                  child: Text(
                    d,
                    style: AppTypography.labelSmall.copyWith(
                      color: AppColors.grey400,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ))
          .toList(),
    );
  }

  Widget _buildDayGrid() {
    final firstDay =
        DateTime(_focusedMonth.year, _focusedMonth.month, 1);
    final lastDay =
        DateTime(_focusedMonth.year, _focusedMonth.month + 1, 0);
    // Monday=1, Sunday=7 → offset Monday-based
    final startWeekday = (firstDay.weekday - 1) % 7;

    final totalCells = startWeekday + lastDay.day;
    final rows = (totalCells / 7).ceil();

    final minDate = widget.minDate ?? DateTime(_today.year, _today.month, _today.day);

    return Column(
      children: List.generate(rows, (row) {
        return Row(
          children: List.generate(7, (col) {
            final cellIndex = row * 7 + col;
            final dayNum = cellIndex - startWeekday + 1;

            if (dayNum < 1 || dayNum > lastDay.day) {
              return const Expanded(child: SizedBox(height: 44));
            }

            final date = DateTime(
                _focusedMonth.year, _focusedMonth.month, dayNum);
            final isPast = date.isBefore(minDate);
            final isSelected = widget.selectedDate != null &&
                _isSameDay(date, widget.selectedDate!);
            final isToday = _isSameDay(date, _today);

            return Expanded(
              child: GestureDetector(
                onTap: isPast ? null : () => widget.onDateSelected(date),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  height: 44,
                  margin: const EdgeInsets.all(2),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? AppColors.primary
                        : isToday
                            ? AppColors.primaryLight
                            : null,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Center(
                    child: Text(
                      '$dayNum',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight:
                            isSelected || isToday ? FontWeight.w700 : FontWeight.w500,
                        color: isPast
                            ? AppColors.grey300
                            : isSelected
                                ? AppColors.white
                                : AppColors.grey800,
                      ),
                    ),
                  ),
                ),
              ),
            );
          }),
        );
      }),
    );
  }

  bool _isSameDay(DateTime a, DateTime b) =>
      a.year == b.year && a.month == b.month && a.day == b.day;
}
