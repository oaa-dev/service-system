import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../entities/referral_entity.dart';
import '../repositories/referrals_repository.dart';

@lazySingleton
class GetMyReferralsUseCase {
  final ReferralsRepository _repository;

  const GetMyReferralsUseCase(this._repository);

  Future<Either<Failure, List<ReferralEntity>>> call() {
    return _repository.getMyReferrals();
  }
}
