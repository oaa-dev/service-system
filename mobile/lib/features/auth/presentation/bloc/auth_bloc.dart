import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';
import '../../domain/usecases/check_auth_status_use_case.dart';
import '../../domain/usecases/get_current_user_use_case.dart';
import '../../domain/usecases/login_use_case.dart';
import '../../domain/usecases/logout_use_case.dart';
import '../../domain/usecases/register_use_case.dart';
import 'auth_event.dart';
import 'auth_state.dart';

@injectable
class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final LoginUseCase _login;
  final RegisterUseCase _register;
  final LogoutUseCase _logout;
  final GetCurrentUserUseCase _getCurrentUser;
  final CheckAuthStatusUseCase _checkAuthStatus;

  AuthBloc(
    this._login,
    this._register,
    this._logout,
    this._getCurrentUser,
    this._checkAuthStatus,
  ) : super(const AuthInitial()) {
    on<AuthCheckRequested>(_onCheckRequested);
    on<AuthLoginRequested>(_onLoginRequested);
    on<AuthRegisterRequested>(_onRegisterRequested);
    on<AuthLogoutRequested>(_onLogoutRequested);
    on<AuthUserRefreshRequested>(_onUserRefreshRequested);
  }

  Future<void> _onCheckRequested(
    AuthCheckRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    final hasTokenResult = await _checkAuthStatus();
    await hasTokenResult.fold(
      (failure) async => emit(const AuthUnauthenticated()),
      (hasToken) async {
        if (!hasToken) {
          emit(const AuthUnauthenticated());
          return;
        }
        final userResult = await _getCurrentUser();
        userResult.fold(
          (failure) => emit(const AuthUnauthenticated()),
          (user) {
            if (!user.isVerified) {
              emit(const AuthNeedsVerification());
            } else {
              emit(AuthAuthenticated(user));
            }
          },
        );
      },
    );
  }

  Future<void> _onLoginRequested(
    AuthLoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    final result = await _login(event.email, event.password);
    result.fold(
      (failure) => emit(AuthError(failure.message)),
      (user) {
        if (user.requiresVerification) {
          emit(const AuthNeedsVerification());
        } else {
          emit(AuthAuthenticated(user));
        }
      },
    );
  }

  Future<void> _onRegisterRequested(
    AuthRegisterRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    final result = await _register(
      firstName: event.firstName,
      lastName: event.lastName,
      email: event.email,
      password: event.password,
      passwordConfirmation: event.passwordConfirmation,
    );
    result.fold(
      (failure) => emit(AuthError(failure.message)),
      (_) => emit(const AuthNeedsVerification()),
    );
  }

  Future<void> _onLogoutRequested(
    AuthLogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    await _logout();
    emit(const AuthUnauthenticated());
  }

  Future<void> _onUserRefreshRequested(
    AuthUserRefreshRequested event,
    Emitter<AuthState> emit,
  ) async {
    final result = await _getCurrentUser();
    result.fold(
      (failure) => emit(const AuthUnauthenticated()),
      (user) => emit(AuthAuthenticated(user)),
    );
  }
}
