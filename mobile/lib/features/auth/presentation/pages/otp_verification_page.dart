import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/utils/validators.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_text_field.dart';
import '../bloc/auth_bloc.dart';
import '../bloc/auth_event.dart';
import '../bloc/otp_bloc.dart';
import '../bloc/otp_event.dart';
import '../bloc/otp_state.dart';

class OtpVerificationPage extends StatefulWidget {
  const OtpVerificationPage({super.key});

  @override
  State<OtpVerificationPage> createState() => _OtpVerificationPageState();
}

class _OtpVerificationPageState extends State<OtpVerificationPage> {
  final _formKey = GlobalKey<FormState>();
  final _otpController = TextEditingController();

  @override
  void initState() {
    super.initState();
    context.read<OtpBloc>().add(const OtpStatusChecked());
  }

  @override
  void dispose() {
    _otpController.dispose();
    super.dispose();
  }

  void _onSubmit() {
    if (!_formKey.currentState!.validate()) return;
    context.read<OtpBloc>().add(OtpSubmitted(_otpController.text.trim()));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: MultiBlocListener(
        listeners: [
          BlocListener<OtpBloc, OtpState>(
            listener: (context, state) {
              if (state is OtpSuccess) {
                context.read<AuthBloc>().add(const AuthUserRefreshRequested());
              }
              if (state is OtpError) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(state.message),
                    backgroundColor: AppColors.error,
                  ),
                );
              }
              if (state is OtpResent) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Verification code resent'),
                    backgroundColor: AppColors.success,
                  ),
                );
              }
            },
          ),
        ],
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 48),
                  Text(
                    'Verify your email',
                    style: AppTypography.headlineMedium,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    "Enter the 6-digit code sent to your email address.",
                    style: AppTypography.bodyLarge,
                  ),
                  const SizedBox(height: 40),
                  AppTextField(
                    label: 'Verification Code',
                    hint: '000000',
                    controller: _otpController,
                    keyboardType: TextInputType.number,
                    textInputAction: TextInputAction.done,
                    onSubmitted: (_) => _onSubmit(),
                    validator: AppValidators.otp,
                    inputFormatters: [
                      FilteringTextInputFormatter.digitsOnly,
                      LengthLimitingTextInputFormatter(6),
                    ],
                  ),
                  const SizedBox(height: 32),
                  BlocBuilder<OtpBloc, OtpState>(
                    builder: (context, state) {
                      return AppButton(
                        label: 'Verify',
                        onPressed: _onSubmit,
                        isLoading: state is OtpLoading,
                      );
                    },
                  ),
                  const SizedBox(height: 24),
                  Center(
                    child: BlocBuilder<OtpBloc, OtpState>(
                      builder: (context, state) {
                        if (state is OtpCooldown) {
                          final minutes = state.secondsRemaining ~/ 60;
                          final seconds = state.secondsRemaining % 60;
                          return Text(
                            'Resend in ${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}',
                            style: AppTypography.bodyMedium
                                .copyWith(color: AppColors.grey400),
                          );
                        }
                        return TextButton(
                          onPressed: () => context
                              .read<OtpBloc>()
                              .add(const OtpResendRequested()),
                          child: Text(
                            'Resend code',
                            style: AppTypography.bodyMedium.copyWith(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
