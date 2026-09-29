import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:sovereign_dating/features/posts/domain/post.dart';
import 'package:sovereign_dating/features/posts/presentation/posts_screen.dart';
import 'package:sovereign_dating/features/posts/presentation/create_post_screen.dart';

void main() {
  group('Community Posts Domain & UI Tests', () {
    test('CommunityPost parsing, imageUrl, and copyWith', () {
      final post = CommunityPost(
        id: 'post-101',
        authorId: 'usr-1',
        authorName: 'Sara',
        authorAge: 24,
        authorCity: 'Addis Ababa',
        authorPhotoUrl: 'https://example.com/photo.jpg',
        category: 'Date Idea',
        content: 'Sunset coffee ceremony at Entoto Park',
        imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd',
        likesCount: 5,
        isLiked: false,
        createdAt: DateTime.now(),
      );

      expect(post.isLiked, false);
      expect(post.likesCount, 5);
      expect(post.imageUrl, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd');

      final json = post.toJson();
      final parsed = CommunityPost.fromJson(json);
      expect(parsed.id, 'post-101');
      expect(parsed.authorName, 'Sara');
      expect(parsed.category, 'Date Idea');
      expect(parsed.imageUrl, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd');

      final liked = post.copyWith(isLiked: true, likesCount: 6);
      expect(liked.isLiked, true);
      expect(liked.likesCount, 6);
      expect(liked.imageUrl, post.imageUrl);
    });

    testWidgets('PostsScreen renders title and New Post button',
        (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: PostsScreen(),
          ),
        ),
      );

      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('POST'), findsOneWidget);
      expect(find.text('New Post'), findsOneWidget);
    });

    testWidgets('CreatePostScreen renders category chips, photo options, and text input',
        (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: CreatePostScreen(),
          ),
        ),
      );

      await tester.pump();

      expect(find.text('New Post'), findsOneWidget);
      expect(find.text('CHOOSE A TOPIC'), findsOneWidget);
      expect(find.text('💡 Date Idea'), findsOneWidget);
      expect(find.text('ATTACH A PHOTO'), findsOneWidget);
      expect(find.text('Choose Photo from Device'), findsOneWidget);
      expect(find.text('Share with Community'), findsOneWidget);
    });
  });
}
