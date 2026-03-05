import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';
import '../../../../../features/auth/domain/usecases/logout_use_case.dart';
import '../../../domain/usecases/get_profile_use_case.dart';
import '../../../domain/usecases/update_profile_use_case.dart';
import '../../../domain/usecases/upload_avatar_use_case.dart';
import '../../../domain/usecases/change_password_use_case.dart';
import '../../../domain/usecases/get_payment_methods_use_case.dart';
import '../../../domain/usecases/update_payment_preference_use_case.dart';
import 'profile_event.dart';
import 'profile_state.dart';

@injectable
class ProfileBloc extends Bloc<ProfileEvent, ProfileState> {
  final GetProfileUseCase _getProfile;
  final UpdateProfileUseCase _updateProfile;
  final UploadAvatarUseCase _uploadAvatar;
  final ChangePasswordUseCase _changePassword;
  final GetPaymentMethodsUseCase _getPaymentMethods;
  final UpdatePaymentPreferenceUseCase _updatePaymentPreference;
  final LogoutUseCase _logout;

  ProfileBloc(
    this._getProfile,
    this._updateProfile,
    this._uploadAvatar,
    this._changePassword,
    this._getPaymentMethods,
    this._updatePaymentPreference,
    this._logout,
  ) : super(const ProfileInitial()) {
    on<LoadProfileEvent>(_onLoadProfile);
    on<UpdateProfileEvent>(_onUpdateProfile);
    on<UploadAvatarEvent>(_onUploadAvatar);
    on<DeleteAvatarEvent>(_onDeleteAvatar);
    on<ChangePasswordEvent>(_onChangePassword);
    on<LoadPaymentMethodsEvent>(_onLoadPaymentMethods);
    on<UpdatePaymentPreferenceEvent>(_onUpdatePaymentPreference);
    on<LogoutEvent>(_onLogout);
  }

  Future<void> _onLoadProfile(
    LoadProfileEvent event,
    Emitter<ProfileState> emit,
  ) async {
    emit(const ProfileLoading());
    final result = await _getProfile();
    result.fold(
      (failure) => emit(ProfileError(failure.message)),
      (profile) => emit(ProfileLoaded(profile: profile)),
    );
  }

  Future<void> _onUpdateProfile(
    UpdateProfileEvent event,
    Emitter<ProfileState> emit,
  ) async {
    final current = state;
    if (current is ProfileLoaded) {
      emit(current.copyWith(isUpdating: true));
    }

    final result = await _updateProfile(
      firstName: event.firstName,
      lastName: event.lastName,
      phone: event.phone,
      bio: event.bio,
    );

    result.fold(
      (failure) {
        if (current is ProfileLoaded) {
          emit(current.copyWith(isUpdating: false));
        }
        emit(ProfileError(failure.message));
      },
      (profile) {
        emit(ProfileUpdateSuccess(profile));
        emit(ProfileLoaded(
          profile: profile,
          paymentMethods: current is ProfileLoaded ? current.paymentMethods : const [],
        ));
      },
    );
  }

  Future<void> _onUploadAvatar(
    UploadAvatarEvent event,
    Emitter<ProfileState> emit,
  ) async {
    final current = state;
    if (current is ProfileLoaded) {
      emit(current.copyWith(isUpdating: true));
    }

    final result = await _uploadAvatar(event.filePath);

    result.fold(
      (failure) {
        if (current is ProfileLoaded) {
          emit(current.copyWith(isUpdating: false));
        }
        emit(ProfileError(failure.message));
        if (current is ProfileLoaded) {
          emit(current.copyWith(isUpdating: false));
        }
      },
      (newAvatarUrl) {
        if (current is ProfileLoaded) {
          final updatedProfile = current.profile.copyWith(avatarUrl: newAvatarUrl);
          emit(current.copyWith(profile: updatedProfile, isUpdating: false));
        }
      },
    );
  }

  Future<void> _onDeleteAvatar(
    DeleteAvatarEvent event,
    Emitter<ProfileState> emit,
  ) async {
    final current = state;

    // Reload profile after deletion so avatar_url reflects the change.
    final result = await _getProfile();
    result.fold(
      (failure) => emit(ProfileError(failure.message)),
      (profile) {
        if (current is ProfileLoaded) {
          emit(current.copyWith(profile: profile));
        } else {
          emit(ProfileLoaded(profile: profile));
        }
      },
    );
  }

  Future<void> _onChangePassword(
    ChangePasswordEvent event,
    Emitter<ProfileState> emit,
  ) async {
    final result = await _changePassword(
      currentPassword: event.currentPassword,
      password: event.password,
      passwordConfirmation: event.passwordConfirmation,
    );

    result.fold(
      (failure) => emit(PasswordChangeError(failure.message)),
      (_) {
        emit(const PasswordChangeSuccess());
        // Restore loaded state so the page doesn't go blank.
        final current = state;
        if (current is! ProfileLoaded) {
          add(const LoadProfileEvent());
        }
      },
    );
  }

  Future<void> _onLoadPaymentMethods(
    LoadPaymentMethodsEvent event,
    Emitter<ProfileState> emit,
  ) async {
    final current = state;
    final result = await _getPaymentMethods();
    result.fold(
      (failure) {
        // Non-fatal: keep the current state, methods list stays empty.
      },
      (methods) {
        if (current is ProfileLoaded) {
          emit(current.copyWith(paymentMethods: methods));
        }
      },
    );
  }

  Future<void> _onUpdatePaymentPreference(
    UpdatePaymentPreferenceEvent event,
    Emitter<ProfileState> emit,
  ) async {
    final current = state;

    final result = await _updatePaymentPreference(event.paymentMethodId);
    result.fold(
      (failure) => emit(ProfileError(failure.message)),
      (_) {
        if (current is ProfileLoaded) {
          final updatedProfile = current.profile.copyWith(
            preferredPaymentMethodId: event.paymentMethodId,
          );
          emit(current.copyWith(profile: updatedProfile));
        }
      },
    );
  }

  Future<void> _onLogout(
    LogoutEvent event,
    Emitter<ProfileState> emit,
  ) async {
    await _logout();
    emit(const ProfileInitial());
    // The router's refreshListenable on AuthBloc will redirect to /login
    // because AuthRepository.logout() clears the token, causing AuthBloc
    // to emit AuthUnauthenticated on next check.
  }
}
