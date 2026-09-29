class CommunityPost {
  final String id;
  final String authorId;
  final String authorName;
  final int authorAge;
  final String authorCity;
  final String authorPhotoUrl;
  final String category;
  final String content;
  final String? imageUrl;
  final int likesCount;
  final bool isLiked;
  final DateTime createdAt;

  const CommunityPost({
    required this.id,
    required this.authorId,
    required this.authorName,
    required this.authorAge,
    required this.authorCity,
    required this.authorPhotoUrl,
    required this.category,
    required this.content,
    this.imageUrl,
    required this.likesCount,
    required this.isLiked,
    required this.createdAt,
  });

  factory CommunityPost.fromJson(Map<String, dynamic> json) {
    return CommunityPost(
      id: json['id'] as String? ?? '',
      authorId: json['authorId'] as String? ?? '',
      authorName: json['authorName'] as String? ?? 'Anonymous',
      authorAge: json['authorAge'] as int? ?? 25,
      authorCity: json['authorCity'] as String? ?? 'Addis Ababa',
      authorPhotoUrl: json['authorPhotoUrl'] as String? ?? '',
      category: json['category'] as String? ?? 'Date Idea',
      content: json['content'] as String? ?? '',
      imageUrl: json['imageUrl'] as String?,
      likesCount: json['likesCount'] as int? ?? 0,
      isLiked: json['isLiked'] as bool? ?? false,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'authorId': authorId,
      'authorName': authorName,
      'authorAge': authorAge,
      'authorCity': authorCity,
      'authorPhotoUrl': authorPhotoUrl,
      'category': category,
      'content': content,
      'imageUrl': imageUrl,
      'likesCount': likesCount,
      'isLiked': isLiked,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  CommunityPost copyWith({
    String? id,
    String? authorId,
    String? authorName,
    int? authorAge,
    String? authorCity,
    String? authorPhotoUrl,
    String? category,
    String? content,
    String? imageUrl,
    int? likesCount,
    bool? isLiked,
    DateTime? createdAt,
  }) {
    return CommunityPost(
      id: id ?? this.id,
      authorId: authorId ?? this.authorId,
      authorName: authorName ?? this.authorName,
      authorAge: authorAge ?? this.authorAge,
      authorCity: authorCity ?? this.authorCity,
      authorPhotoUrl: authorPhotoUrl ?? this.authorPhotoUrl,
      category: category ?? this.category,
      content: content ?? this.content,
      imageUrl: imageUrl ?? this.imageUrl,
      likesCount: likesCount ?? this.likesCount,
      isLiked: isLiked ?? this.isLiked,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
