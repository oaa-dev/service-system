import 'package:equatable/equatable.dart';
import '../../../domain/entities/scan_result_entity.dart';

sealed class QrScannerState extends Equatable {
  const QrScannerState();
  @override
  List<Object?> get props => [];
}

class QrScannerReady extends QrScannerState {
  const QrScannerReady();
}

class QrScannerScanning extends QrScannerState {
  const QrScannerScanning();
}

class QrScannerSuccess extends QrScannerState {
  final ScanResultEntity result;
  const QrScannerSuccess(this.result);
  @override
  List<Object?> get props => [result];
}

class QrScannerError extends QrScannerState {
  final String message;
  const QrScannerError(this.message);
  @override
  List<Object?> get props => [message];
}
