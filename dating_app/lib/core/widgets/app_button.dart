import 'package:flutter/material.dart';
import '../../app/theme.dart';

class AppButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;
  final bool isOutlined;
  final Color? color;
  final Color? textColor;
  final IconData? icon;
  final double height;

  const AppButton({
    super.key,
    required this.text,
    required this.onPressed,
    this.isLoading = false,
    this.isOutlined = false,
    this.color,
    this.textColor,
    this.icon,
    this.height = 54,
  });

  @override
  Widget build(BuildContext context) {
    if (isOutlined) {
      return OutlinedButton(
        onPressed: isLoading ? null : onPressed,
        style: OutlinedButton.styleFrom(
          minimumSize: Size.fromHeight(height),
          side: BorderSide(
            color: color ?? AppTheme.primaryGold,
            width: 1.5,
          ),
          foregroundColor: textColor ?? color ?? AppTheme.primaryGold,
        ),
        child: _buildChild(context, textColor ?? color ?? AppTheme.primaryGold),
      );
    }

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        boxShadow: onPressed != null && !isLoading
            ? [
                BoxShadow(
                  color: (color ?? AppTheme.primaryGold).withOpacity(0.3),
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                ),
              ]
            : null,
      ),
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: color ?? AppTheme.primaryGold,
          foregroundColor: textColor ?? Colors.black,
          minimumSize: Size.fromHeight(height),
          disabledBackgroundColor: AppTheme.darkCardBorder,
          disabledForegroundColor: AppTheme.textMuted,
        ),
        child: _buildChild(context, textColor ?? Colors.black),
      ),
    );
  }

  Widget _buildChild(BuildContext context, Color contentColor) {
    if (isLoading) {
      return SizedBox(
        height: 22,
        width: 22,
        child: CircularProgressIndicator(
          strokeWidth: 2.5,
          valueColor: AlwaysStoppedAnimation<Color>(contentColor),
        ),
      );
    }

    if (icon != null) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 20, color: contentColor),
          const SizedBox(width: 8),
          Text(text),
        ],
      );
    }

    return Text(text);
  }
}
