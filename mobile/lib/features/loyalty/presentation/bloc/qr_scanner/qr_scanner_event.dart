import 'package:equatable/equatable.dart';

sealed class QrScannerEvent extends Equatable {
  const QrScannerEvent();
  @override
  List<Object?> get props => [];
}

class ScanQrEvent extends QrScannerEvent {
  final String token;
  const ScanQrEvent(this.token);
  @override
  List<Object?> get props => [token];
}

class ResetScannerEvent extends QrScannerEvent {
  const ResetScannerEvent();
}
