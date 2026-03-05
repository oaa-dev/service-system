import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:image_picker/image_picker.dart';
import '../../../../core/theme/app_colors.dart';
import '../bloc/profile/profile_bloc.dart';
import '../bloc/profile/profile_event.dart';

class AvatarPickerWidget extends StatelessWidget {
  final String? currentAvatarUrl;
  final double size;

  const AvatarPickerWidget({
    super.key,
    this.currentAvatarUrl,
    this.size = 80,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => _pickImage(context),
      child: Stack(
        children: [
          CircleAvatar(
            radius: size / 2,
            backgroundImage: currentAvatarUrl != null
                ? NetworkImage(currentAvatarUrl!)
                : null,
            backgroundColor: AppColors.grey200,
            child: currentAvatarUrl == null
                ? Icon(Icons.person, size: size * 0.6, color: AppColors.grey500)
                : null,
          ),
          Positioned(
            right: 0,
            bottom: 0,
            child: Container(
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primary,
                shape: BoxShape.circle,
              ),
              padding: const EdgeInsets.all(4),
              child: const Icon(Icons.camera_alt, color: Colors.white, size: 16),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _pickImage(BuildContext context) async {
    final picker = ImagePicker();
    final image = await picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 800,
      maxHeight: 800,
      imageQuality: 85,
    );
    if (image != null && context.mounted) {
      context.read<ProfileBloc>().add(UploadAvatarEvent(image.path));
    }
  }
}
