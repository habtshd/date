import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:sovereign_dating/app/app.dart';

void main() {
  testWidgets('SovereignDatingApp boots into SplashScreen and navigates to Welcome', (WidgetTester tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: SovereignDatingApp(),
      ),
    );

    // Initial frame displays Sovereign brand name
    expect(find.text('SOVEREIGN'), findsOneWidget);
    expect(find.text('Verified Dating in Ethiopia'), findsOneWidget);

    // Advance time past splash delay (1600ms)
    await tester.pump(const Duration(milliseconds: 1800));
    await tester.pumpAndSettle();

    // Verify WelcomeScreen loaded
    expect(find.text('Meaningful Dating,\nBuilt on Trust.'), findsOneWidget);
  });
}
