class ProfilePhoto {
  final String id;
  final String url;
  final String? storageKey;
  final bool isPrimary;
  final int? order;

  const ProfilePhoto({
    required this.id,
    required this.url,
    this.storageKey,
    this.isPrimary = false,
    this.order,
  });

  factory ProfilePhoto.fromJson(Map<String, dynamic> json) {
    return ProfilePhoto(
      id: json['id']?.toString() ?? '',
      url: json['url']?.toString() ?? '',
      storageKey: json['storageKey']?.toString(),
      isPrimary: json['isPrimary'] == true,
      order: (json['order'] is num) ? (json['order'] as num).toInt() : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'url': url,
      if (storageKey != null) 'storageKey': storageKey,
      'isPrimary': isPrimary,
      if (order != null) 'order': order,
    };
  }

  ProfilePhoto copyWith({
    String? id,
    String? url,
    String? storageKey,
    bool? isPrimary,
    int? order,
  }) {
    return ProfilePhoto(
      id: id ?? this.id,
      url: url ?? this.url,
      storageKey: storageKey ?? this.storageKey,
      isPrimary: isPrimary ?? this.isPrimary,
      order: order ?? this.order,
    );
  }
}
