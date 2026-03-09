import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../entities/message_entity.dart';
import '../repositories/messaging_repository.dart';

@lazySingleton
class GetMessagesUseCase {
  final MessagingRepository _repository;

  const GetMessagesUseCase(this._repository);

  Future<Either<Failure, List<MessageEntity>>> call(String type, int id) {
    return _repository.getMessages(type, id);
  }
}
