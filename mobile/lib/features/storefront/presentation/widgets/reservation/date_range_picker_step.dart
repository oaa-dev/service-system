import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_typography.dart';

class DateRangePickerStep extends StatefulWidget {
  final DateTime? checkIn;
  final DateTime? checkOut;
  final ValueChanged<DateTime> onCheckInSelected;
  final ValueChanged<DateTime> onCheckOutSelected;

  const DateRangePickerStep({
    super.key,
    this.checkIn,
    this.checkOut,
    required this.onCheckInSelected,
    required this.onCheckOutSelected,
  });

  @override
  State<DateRangePickerStep> createState() => _DateRangePickerStepState();
}

class _DateRangePickerStepState extends State<DateRangePickerStep> {
  late DateTime _focusedMonth;
  final _today = DateTime.now();
  bool _selectingCheckOut = false;

  @override
  void initState() {
    super.initState();
    _focusedMonth = widget.checkIn ?? _today;
    _selectingCheckOut = widget.checkIn != null && widget.checkOut == null;
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Select Dates',
            style: AppTypography.titleMedium.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            _selectingCheckOut
                ? 'Now select your check-out date'
                : 'Select your check-in date',
            style: AppTypography.bodySmall.copyWith(
              color: AppColors.grey500,
            ),
          ),
          const SizedBox(height: 16),
          // Selected dates display
          _buildDateSummary(),
          const SizedBox(height: 16),
          // Calendar
          _buildCalendar(),
        ],
      ),
    );
  }

  Widget _buildDateSummary() {
    return Row(
      children: [
        Expanded(
          child: _buildDateBox(
            label: 'Check-in',
            date: widget.checkIn,
            isActive: !_selectingCheckOut,
            onTap: () {
              setState(() => _selectingCheckOut = false);
            },
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Icon(Icons.arrow_forward_rounded,
              size: 20, color: AppColors.grey400),
        ),
        Expanded(
          child: _buildDateBox(
            label: 'Check-out',
            date: widget.checkOut,
            isActive: _selectingCheckOut,
            onTap: widget.checkIn != null
                ? () {
                    setState(() => _selectingCheckOut = true);
                  }
                : null,
          ),
        ),
      ],
    );
  }

  Widget _buildDateBox({
    required String label,
    required DateTime? date,
    required bool isActive,
    VoidCallback? onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: isActive ? AppColors.primaryLight : AppColors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isActive ? AppColors.primary : AppColors.grey200,
            width: isActive ? 2 : 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: AppTypography.labelSmall.copyWith(
                color: isActive ? AppColors.primary : AppColors.grey400,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              date != null
                  ? DateFormat('MMM d, y').format(date)
                  : 'Select date',
              style: AppTypography.bodyMedium.copyWith(
                fontWeight: date != null ? FontWeight.w600 : FontWeight.w400,
                color: date != null ? AppColors.grey800 : AppColors.grey400,
              ),
            ),
          ],
        ),
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
          icon: const Icon(Icons.chevron_right_rounded,
              color: AppColors.grey800),
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
    final startWeekday = (firstDay.weekday - 1) % 7;

    final totalCells = startWeekday + lastDay.day;
    final rows = (totalCells / 7).ceil();

    final minDate = DateTime(_today.year, _today.month, _today.day);

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

            // For check-out, must be after check-in
            final isBeforeCheckIn = _selectingCheckOut &&
                widget.checkIn != null &&
                !date.isAfter(widget.checkIn!);

            final isDisabled = isPast || isBeforeCheckIn;
            final isCheckIn = widget.checkIn != null &&
                _isSameDay(date, widget.checkIn!);
            final isCheckOut = widget.checkOut != null &&
                _isSameDay(date, widget.checkOut!);
            final isInRange = widget.checkIn != null &&
                widget.checkOut != null &&
                date.isAfter(widget.checkIn!) &&
                date.isBefore(widget.checkOut!);

            return Expanded(
              child: GestureDetector(
                onTap: isDisabled
                    ? null
                    : () {
                        if (_selectingCheckOut) {
                          widget.onCheckOutSelected(date);
                        } else {
                          widget.onCheckInSelected(date);
                          setState(() => _selectingCheckOut = true);
                        }
                      },
                child: Container(
                  height: 44,
                  margin: const EdgeInsets.all(1),
                  decoration: BoxDecoration(
                    color: isCheckIn || isCheckOut
                        ? AppColors.primary
                        : isInRange
                            ? AppColors.primaryLight
                            : null,
                    borderRadius: BorderRadius.circular(
                      isCheckIn || isCheckOut ? 10 : isInRange ? 4 : 10,
                    ),
                  ),
                  child: Center(
                    child: Text(
                      '$dayNum',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: isCheckIn || isCheckOut
                            ? FontWeight.w700
                            : FontWeight.w500,
                        color: isDisabled
                            ? AppColors.grey300
                            : isCheckIn || isCheckOut
                                ? AppColors.white
                                : isInRange
                                    ? AppColors.primary
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
