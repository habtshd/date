import 'auth_user.dart';

enum AuthStatus {
  initial,
  loading,
  unauthenticated,
  authenticated,
  error,
}

class AuthState {
  final AuthStatus status;
  final AuthUser? user;
  final String? errorMessage;

  const AuthState({
    this.status = AuthStatus.initial,
    this.user,
    this.errorMessage,
  });

  bool get isAuthenticated => status == AuthStatus.authenticated && user != null;
  bool get isLoading => status == AuthStatus.loading;
  bool get isInitial => status == AuthStatus.initial;
  bool get hasProfile => user?.hasProfile ?? false;
  bool get isVerified => user?.isVerified ?? false;

  AuthState copyWith({
    AuthStatus? status,
    AuthUser? user,
    String? errorMessage,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: user ?? this.user,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
}
