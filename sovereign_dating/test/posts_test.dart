import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:sovereign_dating/features/posts/domain/post.dart';
import 'package:sovereign_dating/features/posts/presentation/posts_screen.dart';
import 'package:sovereign_dating/features/posts/presentation/create_post_screen.dart';

void main() {
  group('Community Posts Domain & UI Tests', () {
    test('CommunityPost parsing and copyWith', () {
      final post = CommunityPost(
        id: 'post-101',
        authorId: 'usr-1',
        authorName: 'Sara',
        authorAge: 24,
        authorCity: 'Addis Ababa',
        authorPhotoUrl: 'https://example.com/photo.jpg',
        category: 'Date Idea',
        content: 'Sunset coffee ceremony at Entoto Park',
        likesCount: 5,
        isLiked: false,
        createdAt: DateTime.now(),
      );

      expect(post.isLiked, false);
      expect(post.likesCount, 5);

      final json = post.toJson();
      final parsed = CommunityPost.fromJson(json);
      expect(parsed.id, 'post-101');
      expect(parsed.authorName, 'Sara');
      expect(parsed.category, 'Date Idea');

      final liked = post.copyWith(isLiked: true, likesCount: 6);
      expect(liked.isLiked, true);
      expect(liked.likesCount, 6);
    });

    testWidgets('PostsScreen renders title and Post Idea button',
        (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: PostsScreen(),
          ),
        ),
      );

      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('IDEAS & THOUGHTS'), findsOneWidget);
      expect(find.text('Post Idea'), findsOneWidget);
    });

    testWidgets('CreatePostScreen renders category chips and text input',
        (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: CreatePostScreen(),
          ),
        ),
      );

      await tester.pump();

      expect(find.text('Share an Idea'), findsOneWidget);
      expect(find.text('CHOOSE A TOPIC'), findsOneWidget);
      expect(find.text('💡 Date Idea'), findsOneWidget);
      expect(find.text('Share with Community'), findsOneWidget);
    });
  });
}
