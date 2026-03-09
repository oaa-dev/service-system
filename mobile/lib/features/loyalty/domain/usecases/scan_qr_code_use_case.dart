import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../entities/scan_result_entity.dart';
import '../repositories/loyalty_repository.dart';

@lazySingleton
class ScanQrCodeUseCase {
  final LoyaltyRepository _repository;

  const ScanQrCodeUseCase(this._repository);

  Future<Either<Failure, ScanResultEntity>> call(String token) {
    return _repository.scanQrCode(token);
  }
}
