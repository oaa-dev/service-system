import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/api_client.dart';
import '../models/message_model.dart';

abstract class MessagingRemoteDataSource {
  Future<Either<Failure, List<MessageModel>>> getMessages(String type, int id);
  Future<Either<Failure, MessageModel>> sendMessage(String type, int id, String body);
  Future<Either<Failure, void>> markAsRead(String type, int id);
}

@LazySingleton(as: MessagingRemoteDataSource)
class MessagingRemoteDataSourceImpl implements MessagingRemoteDataSource {
  final ApiClient _apiClient;

  const MessagingRemoteDataSourceImpl(this._apiClient);

  @override
  Future<Either<Failure, List<MessageModel>>> getMessages(String type, int id) async {
    final result = await _apiClient.get(
      ApiConstants.conversationMessages(type, id),
    );
    return result.map((json) {
      final dataList = json['data'] as List;
      return dataList
          .map((e) => MessageModel.fromJson(e as Map<String, dynamic>))
          .toList();
    });
  }

  @override
  Future<Either<Failure, MessageModel>> sendMessage(String type, int id, String body) async {
    final result = await _apiClient.post(
      ApiConstants.conversationMessages(type, id),
      data: {'body': body},
    );
    return result.map((json) {
      final data = json['data'] as Map<String, dynamic>;
      return MessageModel.fromJson(data);
    });
  }

  @override
  Future<Either<Failure, void>> markAsRead(String type, int id) async {
    final result = await _apiClient.patch(
      ApiConstants.markConversationRead(type, id),
    );
    return result.map((_) {});
  }
}
