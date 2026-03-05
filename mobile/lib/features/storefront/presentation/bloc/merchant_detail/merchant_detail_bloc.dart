import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';
import '../../../domain/usecases/get_merchant_detail_use_case.dart';
import '../../../domain/usecases/get_merchant_services_use_case.dart';
import 'merchant_detail_event.dart';
import 'merchant_detail_state.dart';

@injectable
class MerchantDetailBloc
    extends Bloc<MerchantDetailEvent, MerchantDetailState> {
  final GetMerchantDetailUseCase _getMerchantDetail;
  final GetMerchantServicesUseCase _getMerchantServices;

  MerchantDetailBloc(this._getMerchantDetail, this._getMerchantServices)
      : super(const MerchantDetailInitial()) {
    on<LoadMerchantDetailEvent>(_onLoadMerchantDetail);
  }

  Future<void> _onLoadMerchantDetail(
    LoadMerchantDetailEvent event,
    Emitter<MerchantDetailState> emit,
  ) async {
    emit(const MerchantDetailLoading());

    final merchantResult = await _getMerchantDetail(event.slug);
    final servicesResult = await _getMerchantServices(event.slug);

    merchantResult.fold(
      (failure) => emit(MerchantDetailError(failure.message)),
      (merchant) => servicesResult.fold(
        (failure) => emit(MerchantDetailError(failure.message)),
        (services) => emit(MerchantDetailLoaded(
          merchant: merchant,
          services: services,
        )),
      ),
    );
  }
}
