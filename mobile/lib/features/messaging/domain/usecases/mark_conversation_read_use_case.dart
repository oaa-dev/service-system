import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../repositories/messaging_repository.dart';

@lazySingleton
class MarkConversationReadUseCase {
  final MessagingRepository _repository;

  const MarkConversationReadUseCase(this._repository);

  Future<Either<Failure, void>> call(String type, int id) {
    return _repository.markAsRead(type, id);
  }
}
