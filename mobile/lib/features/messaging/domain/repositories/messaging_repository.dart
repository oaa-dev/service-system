import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failures.dart';
import '../entities/message_entity.dart';

abstract class MessagingRepository {
  Future<Either<Failure, List<MessageEntity>>> getMessages(String type, int id);
  Future<Either<Failure, MessageEntity>> sendMessage(String type, int id, String body);
  Future<Either<Failure, void>> markAsRead(String type, int id);
}
