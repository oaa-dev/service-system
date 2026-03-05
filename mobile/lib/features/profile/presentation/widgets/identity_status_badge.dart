import 'package:flutter/material.dart';

class IdentityStatusBadge extends StatelessWidget {
  /// Possible values: "none" | "pending" | "approved" | "rejected"
  final String status;

  const IdentityStatusBadge({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    final (label, color, icon) = switch (status) {
      'approved' => ('Verified', Colors.green, Icons.verified),
      'pending' => ('Pending Review', Colors.orange, Icons.hourglass_empty),
      'rejected' => ('Rejected', Colors.red, Icons.cancel),
      _ => ('Not Submitted', Colors.grey, Icons.info_outline),
    };

    return Chip(
      avatar: Icon(icon, size: 16, color: color),
      label: Text(label),
      side: BorderSide(color: color.withValues(alpha: 0.3)),
      backgroundColor: color.withValues(alpha: 0.1),
    );
  }
}
