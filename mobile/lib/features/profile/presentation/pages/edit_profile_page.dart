import 'package:flutter/material.dart';
import '../widgets/personal_info_form.dart';
import '../widgets/change_password_form.dart';
import '../widgets/payment_methods_tab.dart';

class EditProfilePage extends StatelessWidget {
  const EditProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Edit Profile'),
          bottom: const TabBar(
            tabs: [
              Tab(text: 'Personal Info'),
              Tab(text: 'Password'),
              Tab(text: 'Payment'),
            ],
          ),
        ),
        body: const TabBarView(
          children: [
            PersonalInfoForm(),
            ChangePasswordForm(),
            PaymentMethodsTab(),
          ],
        ),
      ),
    );
  }
}
