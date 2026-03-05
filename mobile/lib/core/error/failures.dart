import 'package:equatable/equatable.dart';

sealed class Failure extends Equatable {
  final String message;
  const Failure(this.message);

  @override
  List<Object?> get props => [message];
}

class ServerFailure extends Failure {
  final int? statusCode;
  const ServerFailure(super.message, {this.statusCode});

  @override
  List<Object?> get props => [message, statusCode];
}

class NetworkFailure extends Failure {
  const NetworkFailure(super.message);
}

class AuthFailure extends Failure {
  const AuthFailure(super.message);
}

class ValidationFailure extends Failure {
  final Map<String, List<String>> errors;
  const ValidationFailure(super.message, {this.errors = const {}});

  @override
  List<Object?> get props => [message, errors];
}

class CacheFailure extends Failure {
  const CacheFailure(super.message);
}

class ConflictFailure extends Failure {
  const ConflictFailure(super.message);
}
