import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../domain/post.dart';

final postsRepositoryProvider = Provider<PostsRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  return PostsRepository(client.dio);
});

class PostsRepository {
  final Dio _dio;

  PostsRepository(this._dio);

  Future<List<CommunityPost>> getPosts() async {
    try {
      final response = await _dio.get('/posts');
      final data = response.data as Map<String, dynamic>;
      final list = data['posts'] as List<dynamic>? ?? [];
      return list
          .map((json) => CommunityPost.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return List<CommunityPost>.from(_fallbackPosts);
    }
  }

  Future<CommunityPost> createPost({
    required String content,
    required String category,
    String? imageUrl,
  }) async {
    try {
      final response = await _dio.post(
        '/posts',
        data: {
          'content': content,
          'category': category,
          if (imageUrl != null && imageUrl.isNotEmpty) 'imageUrl': imageUrl,
        },
      );
      final data = response.data as Map<String, dynamic>;
      return CommunityPost.fromJson(data['post'] as Map<String, dynamic>);
    } catch (_) {
      final localPost = CommunityPost(
        id: 'post-${DateTime.now().millisecondsSinceEpoch}',
        authorId: 'usr-me',
        authorName: 'You',
        authorAge: 25,
        authorCity: 'Addis Ababa',
        authorPhotoUrl: '',
        category: category,
        content: content,
        imageUrl: imageUrl,
        likesCount: 0,
        isLiked: false,
        createdAt: DateTime.now(),
      );
      _fallbackPosts.insert(0, localPost);
      return localPost;
    }
  }

  Future<void> likePost(String postId) async {
    try {
      await _dio.post('/posts/$postId/like');
    } catch (_) {}
  }

  static final List<CommunityPost> _fallbackPosts = [
    CommunityPost(
      id: 'post-1',
      authorId: 'usr-bethlehem',
      authorName: 'Bethlehem',
      authorAge: 25,
      authorCity: 'Addis Ababa',
      authorPhotoUrl:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      category: 'Date Idea',
      content:
          'A traditional Buna Qala coffee ceremony followed by a late afternoon walk through Entoto Park overlooking the Addis skyline. Best conversation starter ever! ☕🌅',
      imageUrl:
          'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1000&q=80',
      likesCount: 14,
      isLiked: false,
      createdAt: DateTime.now().subtract(const Duration(hours: 2)),
    ),
    CommunityPost(
      id: 'post-2',
      authorId: 'usr-dawit',
      authorName: 'Dawit',
      authorAge: 28,
      authorCity: 'Addis Ababa',
      authorPhotoUrl:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      category: 'Deep Thought',
      content:
          'Looking for a partnership where we respect our Ethiopian family roots and traditions, while giving each other the freedom to build modern dreams and travel the world together. 🌍✨',
      imageUrl:
          'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1000&q=80',
      likesCount: 9,
      isLiked: false,
      createdAt: DateTime.now().subtract(const Duration(hours: 6)),
    ),
    CommunityPost(
      id: 'post-3',
      authorId: 'usr-selam',
      authorName: 'Selamawit',
      authorAge: 26,
      authorCity: 'Addis Ababa',
      authorPhotoUrl:
          'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      category: 'Weekend Plan',
      content:
          'Sunday afternoon acoustic jazz at Fendika Cultural Center and debating Ethiopian literature over ginger tea. Who wants to join? 🎷📖',
      imageUrl:
          'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1000&q=80',
      likesCount: 19,
      isLiked: false,
      createdAt: DateTime.now().subtract(const Duration(hours: 12)),
    ),
  ];
}
