import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_text_field.dart';
import '../bloc/profile/profile_bloc.dart';
import '../bloc/profile/profile_event.dart';
import '../bloc/profile/profile_state.dart';
import 'avatar_picker_widget.dart';

class PersonalInfoForm extends StatefulWidget {
  const PersonalInfoForm({super.key});

  @override
  State<PersonalInfoForm> createState() => _PersonalInfoFormState();
}

class _PersonalInfoFormState extends State<PersonalInfoForm> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _bioController = TextEditingController();

  bool _prefilled = false;

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
    _bioController.dispose();
    super.dispose();
  }

  void _prefillFromState(ProfileLoaded state) {
    if (_prefilled) return;
    _firstNameController.text = state.profile.firstName;
    _lastNameController.text = state.profile.lastName;
    _phoneController.text = state.profile.phone ?? '';
    _bioController.text = state.profile.bio ?? '';
    _prefilled = true;
  }

  void _onSubmit(BuildContext context) {
    if (!_formKey.currentState!.validate()) return;
    context.read<ProfileBloc>().add(
          UpdateProfileEvent(
            firstName: _firstNameController.text.trim(),
            lastName: _lastNameController.text.trim(),
            phone: _phoneController.text.trim().isEmpty
                ? null
                : _phoneController.text.trim(),
            bio: _bioController.text.trim().isEmpty
                ? null
                : _bioController.text.trim(),
          ),
        );
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<ProfileBloc, ProfileState>(
      listener: (context, state) {
        if (state is ProfileUpdateSuccess) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Profile updated successfully.')),
          );
        }
        if (state is ProfileError) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(state.message)),
          );
        }
      },
      builder: (context, state) {
        if (state is ProfileLoaded) {
          _prefillFromState(state);
          return SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Form(
              key: _formKey,
              child: Column(
                children: [
                  AvatarPickerWidget(
                    currentAvatarUrl: state.profile.avatarUrl,
                    size: 96,
                  ),
                  const SizedBox(height: 24),
                  AppTextField(
                    label: 'First Name',
                    hint: 'Enter your first name',
                    controller: _firstNameController,
                    textInputAction: TextInputAction.next,
                    validator: (v) =>
                        (v == null || v.trim().isEmpty) ? 'Required' : null,
                  ),
                  const SizedBox(height: 16),
                  AppTextField(
                    label: 'Last Name',
                    hint: 'Enter your last name',
                    controller: _lastNameController,
                    textInputAction: TextInputAction.next,
                    validator: (v) =>
                        (v == null || v.trim().isEmpty) ? 'Required' : null,
                  ),
                  const SizedBox(height: 16),
                  AppTextField(
                    label: 'Phone',
                    hint: 'e.g. 09171234567',
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    textInputAction: TextInputAction.next,
                  ),
                  const SizedBox(height: 16),
                  AppTextField(
                    label: 'Bio',
                    hint: 'Tell us about yourself',
                    controller: _bioController,
                    maxLines: 3,
                    textInputAction: TextInputAction.done,
                  ),
                  const SizedBox(height: 32),
                  AppButton(
                    label: 'Save Changes',
                    onPressed: () => _onSubmit(context),
                    isLoading: state.isUpdating,
                  ),
                ],
              ),
            ),
          );
        }

        return const Center(child: CircularProgressIndicator());
      },
    );
  }
}
