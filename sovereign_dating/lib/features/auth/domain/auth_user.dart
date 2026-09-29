class AuthUser {
  final String id;
  final String phoneNumber;
  final bool phoneVerified;
  final String verificationStatus; // UNVERIFIED, PENDING, VERIFIED, FAILED
  final String accountStatus; // ACTIVE, SUSPENDED, BANNED, DELETED
  final String role; // USER, MODERATOR, ADMIN
  final bool hasProfile;

  const AuthUser({
    required this.id,
    required this.phoneNumber,
    this.phoneVerified = false,
    this.verificationStatus = 'UNVERIFIED',
    this.accountStatus = 'ACTIVE',
    this.role = 'USER',
    this.hasProfile = false,
  });

  bool get isVerified => verificationStatus == 'VERIFIED';
  bool get isPendingVerification => verificationStatus == 'PENDING';
  bool get isActive => accountStatus == 'ACTIVE';
  bool get isAdmin => role == 'ADMIN';

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id']?.toString() ?? '',
      phoneNumber: json['phoneNumber']?.toString() ?? '',
      phoneVerified: json['phoneVerified'] == true,
      verificationStatus: json['verificationStatus']?.toString() ?? 'UNVERIFIED',
      accountStatus: json['accountStatus']?.toString() ?? 'ACTIVE',
      role: json['role']?.toString() ?? 'USER',
      hasProfile: json['hasProfile'] == true || json['profile'] != null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'phoneNumber': phoneNumber,
      'phoneVerified': phoneVerified,
      'verificationStatus': verificationStatus,
      'accountStatus': accountStatus,
      'role': role,
      'hasProfile': hasProfile,
    };
  }

  AuthUser copyWith({
    String? id,
    String? phoneNumber,
    bool? phoneVerified,
    String? verificationStatus,
    String? accountStatus,
    String? role,
    bool? hasProfile,
  }) {
    return AuthUser(
      id: id ?? this.id,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      phoneVerified: phoneVerified ?? this.phoneVerified,
      verificationStatus: verificationStatus ?? this.verificationStatus,
      accountStatus: accountStatus ?? this.accountStatus,
      role: role ?? this.role,
      hasProfile: hasProfile ?? this.hasProfile,
    );
  }
}
