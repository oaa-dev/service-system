import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../entities/message_entity.dart';
import '../repositories/messaging_repository.dart';

@lazySingleton
class SendMessageUseCase {
  final MessagingRepository _repository;

  const SendMessageUseCase(this._repository);

  Future<Either<Failure, MessageEntity>> call(String type, int id, String body) {
    return _repository.sendMessage(type, id, body);
  }
}
