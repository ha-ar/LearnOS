import 'package:flutter/material.dart';

/// Ultra-Clean Light Mode Bento Color System for LearnOS.
/// Inspired by modern Scandinavian UI aesthetics: crisp white surfaces,
/// soft off-white canvas, dark contrast pill actions, and pastel accent bento cards.
class AppColors {
  AppColors._();

  // Canvas & Surface Palette (Light Target)
  static const Color lightBackground = Color(0xFFF7F8FA);
  static const Color lightSurface = Color(0xFFFFFFFF);
  static const Color lightSurfaceElevated = Color(0xFFF1F5F9);
  static const Color lightGlassBackground = Color(0xF0FFFFFF);
  static const Color lightBorder = Color(0xFFE5E7EB);
  static const Color lightBorderSubtle = Color(0xFFF3F4F6);

  // Legacy Dark Palette (Kept for fallback)
  static const Color darkBackground = Color(0xFF0F1117);
  static const Color darkSurface = Color(0xFF181A22);
  static const Color darkSurfaceElevated = Color(0xFF212431);
  static const Color darkGlassBackground = Color(0xCC181A22);
  static const Color darkBorder = Color(0x1AFFFFFF);
  static const Color darkBorderSubtle = Color(0x0DFFFFFF);

  // Primary Action Color (Dark Obsidian Contrast Pill)
  static const Color primary = Color(0xFF0F172A); // Dark Slate / Obsidian
  static const Color primaryHover = Color(0xFF1E293B);
  static const Color primaryLight = Color(0xFFF8FAFC);
  static const Color primaryContainer = Color(0xFFF1F5F9);

  // Vibrant Accents
  static const Color accentCyan = Color(0xFF0EA5E9); // Sky Cyan
  static const Color success = Color(0xFF10B981); // Emerald Green
  static const Color warning = Color(0xFFF59E0B); // Amber Warning
  static const Color error = Color(0xFFEF4444); // Crimson Alert

  // Pastel Bento Card Containers
  static const Color pastelMint = Color(0xFFECFDF5);
  static const Color pastelMintText = Color(0xFF047857);

  static const Color pastelBlue = Color(0xFFEFF6FF);
  static const Color pastelBlueText = Color(0xFF1D4ED8);

  static const Color pastelLavender = Color(0xFFF5F3FF);
  static const Color pastelLavenderText = Color(0xFF6D28D9);

  static const Color pastelPeach = Color(0xFFFFF7ED);
  static const Color pastelPeachText = Color(0xFFC2410C);

  // Typography Colors (Light Mode Default)
  static const Color textPrimaryLight = Color(0xFF0F172A);
  static const Color textSecondaryLight = Color(0xFF334155);
  static const Color textMutedLight = Color(0xFF64748B);

  // Typography Colors (Dark Mode Fallback)
  static const Color textPrimaryDark = Color(0xFFF8FAFC);
  static const Color textSecondaryDark = Color(0xFFCBD5E1);
  static const Color textMutedDark = Color(0xFF94A3B8);

  // macOS Window Traffic Light Controls
  static const Color macosClose = Color(0xFFFF5F56);
  static const Color macosMinimize = Color(0xFFFFBD2E);
  static const Color macosZoom = Color(0xFF27C93F);

  // Modern Gradients
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFF0F172A), Color(0xFF334155)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient heroGradientLight = LinearGradient(
    colors: [Color(0xFFEFF6FF), Color(0xFFF5F3FF)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}
