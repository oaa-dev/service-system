import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';
import '../../domain/usecases/get_my_referral_codes_use_case.dart';
import '../../domain/usecases/get_my_referrals_use_case.dart';
import '../../domain/usecases/get_my_referral_rewards_use_case.dart';
import '../../domain/usecases/accept_referral_use_case.dart';
import 'referrals_event.dart';
import 'referrals_state.dart';

@injectable
class ReferralsBloc extends Bloc<ReferralsEvent, ReferralsState> {
  final GetMyReferralCodesUseCase _getMyReferralCodes;
  final GetMyReferralsUseCase _getMyReferrals;
  final GetMyReferralRewardsUseCase _getMyReferralRewards;
  final AcceptReferralUseCase _acceptReferral;

  ReferralsBloc(
    this._getMyReferralCodes,
    this._getMyReferrals,
    this._getMyReferralRewards,
    this._acceptReferral,
  ) : super(const ReferralsInitial()) {
    on<LoadAllReferralDataEvent>(_onLoadAll);
    on<AcceptReferralEvent>(_onAccept);
    on<RefreshReferralsEvent>(_onRefresh);
  }

  Future<void> _onLoadAll(
      LoadAllReferralDataEvent event, Emitter<ReferralsState> emit) async {
    emit(const ReferralsLoading());
    await _fetchAll(emit);
  }

  Future<void> _onAccept(
      AcceptReferralEvent event, Emitter<ReferralsState> emit) async {
    emit(const ReferralAccepting());
    final result = await _acceptReferral(event.code);
    result.fold(
      (failure) => emit(ReferralsError(failure.message)),
      (response) {
        final message =
            response['message'] as String? ?? 'Referral accepted successfully!';
        emit(ReferralAcceptSuccess(message));
        // Re-fetch all data after accepting
        add(const LoadAllReferralDataEvent());
      },
    );
  }

  Future<void> _onRefresh(
      RefreshReferralsEvent event, Emitter<ReferralsState> emit) async {
    await _fetchAll(emit);
  }

  Future<void> _fetchAll(Emitter<ReferralsState> emit) async {
    final results = await Future.wait([
      _getMyReferralCodes(),
      _getMyReferrals(),
      _getMyReferralRewards(),
    ]);

    final codesResult = results[0];
    final referralsResult = results[1];
    final rewardsResult = results[2];

    // If any fails, show error
    final codesEither = codesResult as dynamic;
    final referralsEither = referralsResult as dynamic;
    final rewardsEither = rewardsResult as dynamic;

    if (codesEither.isLeft()) {
      emit(ReferralsError(codesEither.getLeft().toNullable()!.message));
      return;
    }
    if (referralsEither.isLeft()) {
      emit(ReferralsError(referralsEither.getLeft().toNullable()!.message));
      return;
    }
    if (rewardsEither.isLeft()) {
      emit(ReferralsError(rewardsEither.getLeft().toNullable()!.message));
      return;
    }

    emit(ReferralsLoaded(
      codes: codesEither.getRight().toNullable()!,
      referrals: referralsEither.getRight().toNullable()!,
      rewards: rewardsEither.getRight().toNullable()!,
    ));
  }
}
