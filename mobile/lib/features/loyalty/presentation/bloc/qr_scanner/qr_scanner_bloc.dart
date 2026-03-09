import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';
import '../../../domain/usecases/scan_qr_code_use_case.dart';
import 'qr_scanner_event.dart';
import 'qr_scanner_state.dart';

@injectable
class QrScannerBloc extends Bloc<QrScannerEvent, QrScannerState> {
  final ScanQrCodeUseCase _scanQrCode;

  QrScannerBloc(this._scanQrCode) : super(const QrScannerReady()) {
    on<ScanQrEvent>(_onScan);
    on<ResetScannerEvent>(_onReset);
  }

  Future<void> _onScan(
      ScanQrEvent event, Emitter<QrScannerState> emit) async {
    emit(const QrScannerScanning());
    final result = await _scanQrCode(event.token);
    result.fold(
      (failure) => emit(QrScannerError(failure.message)),
      (scanResult) => emit(QrScannerSuccess(scanResult)),
    );
  }

  void _onReset(ResetScannerEvent event, Emitter<QrScannerState> emit) {
    emit(const QrScannerReady());
  }
}
