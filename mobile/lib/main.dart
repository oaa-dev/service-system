import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'config/injection.dart';
import 'config/router.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/presentation/bloc/auth_bloc.dart';
import 'features/auth/presentation/bloc/auth_event.dart';
import 'features/auth/presentation/bloc/otp_bloc.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  configureDependencies();
  runApp(const CustomerPortalApp());
}

class CustomerPortalApp extends StatefulWidget {
  const CustomerPortalApp({super.key});

  @override
  State<CustomerPortalApp> createState() => _CustomerPortalAppState();
}

class _CustomerPortalAppState extends State<CustomerPortalApp> {
  late final AuthBloc _authBloc;
  late final OtpBloc _otpBloc;

  @override
  void initState() {
    super.initState();
    _authBloc = getIt<AuthBloc>();
    _otpBloc = getIt<OtpBloc>();
    _authBloc.add(const AuthCheckRequested());
  }

  @override
  void dispose() {
    _authBloc.close();
    _otpBloc.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider.value(value: _authBloc),
        BlocProvider.value(value: _otpBloc),
      ],
      child: Builder(
        builder: (context) {
          final router = createAppRouter(_authBloc);
          return MaterialApp.router(
            title: 'Customer Portal',
            theme: AppTheme.light,
            routerConfig: router,
            debugShowCheckedModeBanner: false,
          );
        },
      ),
    );
  }
}
