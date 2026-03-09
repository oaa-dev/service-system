import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../repositories/referrals_repository.dart';

@lazySingleton
class GenerateReferralCodeUseCase {
  final ReferralsRepository _repository;

  const GenerateReferralCodeUseCase(this._repository);

  Future<Either<Failure, Map<String, dynamic>>> call(int merchantId) {
    return _repository.generateReferralCode(merchantId);
  }
}
