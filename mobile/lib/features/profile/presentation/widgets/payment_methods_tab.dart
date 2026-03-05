import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../bloc/profile/profile_bloc.dart';
import '../bloc/profile/profile_event.dart';
import '../bloc/profile/profile_state.dart';

class PaymentMethodsTab extends StatefulWidget {
  const PaymentMethodsTab({super.key});

  @override
  State<PaymentMethodsTab> createState() => _PaymentMethodsTabState();
}

class _PaymentMethodsTabState extends State<PaymentMethodsTab> {
  bool _loaded = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_loaded) {
      _loaded = true;
      context.read<ProfileBloc>().add(const LoadPaymentMethodsEvent());
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<ProfileBloc, ProfileState>(
      builder: (context, state) {
        if (state is! ProfileLoaded) {
          return const Center(child: CircularProgressIndicator());
        }

        // Email verification gate — required by API before preferences can be set.
        if (!state.profile.isEmailVerified) {
          return const Center(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.lock_outline, size: 48),
                  SizedBox(height: 16),
                  Text(
                    'Email verification required',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Verify your email address to manage payment preferences.',
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          );
        }

        final methods = state.paymentMethods;
        final selectedId = state.profile.preferredPaymentMethodId;

        if (methods.isEmpty) {
          return const Center(child: Text('No payment methods available.'));
        }

        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(
              'Preferred Payment Method',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            ...methods.map(
              (method) => RadioListTile<int>(
                value: method.id,
                // ignore: deprecated_member_use
                groupValue: selectedId,
                title: Text(method.name),
                // ignore: deprecated_member_use
                onChanged: (id) {
                  if (id != null) {
                    context
                        .read<ProfileBloc>()
                        .add(UpdatePaymentPreferenceEvent(id));
                  }
                },
              ),
            ),
          ],
        );
      },
    );
  }
}
