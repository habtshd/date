import 'package:flutter/material.dart';
import '../../app/theme.dart';
import 'app_button.dart';

class ErrorView extends StatelessWidget {
  final String message;
  final String? title;
  final VoidCallback? onRetry;
  final IconData icon;

  const ErrorView({
    super.key,
    required this.message,
    this.title,
    this.onRetry,
    this.icon = Icons.error_outline_rounded,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: AppTheme.accentCoral.withOpacity(0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 40, color: AppTheme.accentCoral),
            ),
            const SizedBox(height: 20),
            Text(
              title ?? 'Something Went Wrong',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppTheme.textPrimary,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              message,
              style: const TextStyle(
                fontSize: 14,
                color: AppTheme.textSecondary,
                height: 1.4,
              ),
              textAlign: TextAlign.center,
            ),
            if (onRetry != null) ...[
              const SizedBox(height: 24),
              SizedBox(
                width: 160,
                child: AppButton(
                  text: 'Try Again',
                  onPressed: onRetry,
                  isOutlined: true,
                  height: 46,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
