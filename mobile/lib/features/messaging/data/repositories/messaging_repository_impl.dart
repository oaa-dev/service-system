import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/message_entity.dart';
import '../../domain/repositories/messaging_repository.dart';
import '../datasources/messaging_remote_data_source.dart';
import '../models/message_model.dart';

@LazySingleton(as: MessagingRepository)
class MessagingRepositoryImpl implements MessagingRepository {
  final MessagingRemoteDataSource _remote;

  const MessagingRepositoryImpl(this._remote);

  @override
  Future<Either<Failure, List<MessageEntity>>> getMessages(String type, int id) async {
    final result = await _remote.getMessages(type, id);
    return result.map((models) => models.map(_toEntity).toList());
  }

  @override
  Future<Either<Failure, MessageEntity>> sendMessage(String type, int id, String body) async {
    final result = await _remote.sendMessage(type, id, body);
    return result.map(_toEntity);
  }

  @override
  Future<Either<Failure, void>> markAsRead(String type, int id) async {
    return _remote.markAsRead(type, id);
  }

  MessageEntity _toEntity(MessageModel model) => MessageEntity(
        id: model.id,
        body: model.body,
        senderId: model.senderId,
        senderName: model.senderName,
        senderAvatar: model.senderAvatar,
        readAt: model.readAt,
        createdAt: model.createdAt,
      );
}
