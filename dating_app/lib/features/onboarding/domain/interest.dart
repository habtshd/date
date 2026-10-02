class Interest {
  final String id;
  final String name;
  final String? category;
  final String? icon;

  const Interest({
    required this.id,
    required this.name,
    this.category,
    this.icon,
  });

  factory Interest.fromJson(Map<String, dynamic> json) {
    return Interest(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      category: json['category']?.toString(),
      icon: json['icon']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      if (category != null) 'category': category,
      if (icon != null) 'icon': icon,
    };
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Interest && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;
}
