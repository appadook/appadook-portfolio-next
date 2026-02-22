import React from 'react';
import { TestTube } from 'lucide-react';
import {
  SiReact,
  SiNextdotjs,
  SiTypescript,
  SiJavascript,
  SiTailwindcss,
  SiNodedotjs,
  SiPython,
  SiFlask,
  SiExpress,
  SiSpringboot,
  SiPostgresql,
  SiMysql,
  SiSupabase,
  SiFirebase,
  SiSqlite,
  SiGit,
  SiDocker,
  SiGradle,
  SiApache,
  SiGooglecloud,
  SiAmazon,
  SiJest,
  SiCypress,
  SiSelenium,
  SiDatabricks,
  SiKubernetes,
  SiGithubactions,
  SiRedis
} from 'react-icons/si';
import { FaJava, FaMicrosoft } from 'react-icons/fa';

// Icon mappings for technologies
export const technologyIcons: { [key: string]: React.ElementType } = {
  // Frontend
  "React.js": SiReact,
  "Next.js": SiNextdotjs,
  "TypeScript": SiTypescript,
  "JavaScript": SiJavascript,
  "Tailwind CSS": SiTailwindcss,
  
  // Backend
  "Node.js": SiNodedotjs,
  "Python": SiPython,
  "Flask": SiFlask,
  "Express.js": SiExpress,
  "Spring Boot": SiSpringboot,
  "Java": FaJava,
  
  // Database
  "PostgreSQL": SiPostgresql,
  "MySQL": SiMysql,
  "Redis": SiRedis,
  "Supabase": SiSupabase,
  "Firebase": SiFirebase,
  "SQL": SiSqlite,
  
  // Mobile
  "React Native": SiReact,
  "Expo": SiReact,
  
  // Testing & QA
  "Jest": SiJest,
  "Cypress": SiCypress,
  "Selenium": SiSelenium,
  "Unit Testing": TestTube,
  
  // DevOps
  "Git": SiGit,
  "Docker": SiDocker,
  "Kubernetes": SiKubernetes,
  "GitHub Actions": SiGithubactions,
  "Gradle": SiGradle,
  "Maven": SiApache,
};

// Icon mappings for cloud providers
export const cloudProviderIcons: { [key: string]: React.ElementType } = {
  "Google Cloud": SiGooglecloud,
  "AWS": SiAmazon,
  "Azure": FaMicrosoft,
  "Databricks": SiDatabricks,
  "Apache": SiApache,
};

