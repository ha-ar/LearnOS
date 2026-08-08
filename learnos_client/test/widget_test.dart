import 'package:flutter_test/flutter_test.dart';
import 'package:learnos_client/main.dart';

void main() {
  testWidgets('LearnOS App Smoke Test', (WidgetTester tester) async {
    await tester.pumpWidget(const LearnOSApp());
    expect(find.text('LearnOS'), findsOneWidget);
  });
}
