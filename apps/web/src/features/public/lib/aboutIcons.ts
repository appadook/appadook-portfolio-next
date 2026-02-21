import React from 'react';
import {
  GraduationCap,
  Trophy,
  Heart,
  Award,
  Users,
  Dumbbell,
  BookOpen,
  Star,
  Target,
  Briefcase,
  Lightbulb,
  Zap,
  Circle,
} from 'lucide-react';

// Icon mappings for about section items
export const aboutIconMap: { [key: string]: React.ElementType } = {
  GraduationCap,
  Trophy,
  Heart,
  Award,
  Users,
  Dumbbell,
  BookOpen,
  Star,
  Target,
  Briefcase,
  Lightbulb,
  Zap,
  Circle, // Default fallback icon
};

/**
 * Get an icon component by name
 * @param iconName - The name of the icon (e.g., "GraduationCap", "Trophy")
 * @returns The icon component or a default Circle icon if not found
 */
export const getAboutIcon = (iconName: string): React.ElementType => {
  return aboutIconMap[iconName] || Circle;
};

