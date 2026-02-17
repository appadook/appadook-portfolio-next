import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  siteSettings: defineTable({
    key: v.string(),
    siteName: v.optional(v.string()),
    tagline: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    profileImageUrl: v.optional(v.string()),
    resumeUrl: v.optional(v.string()),
    updatedAt: v.number(),
  }).index('by_key', ['key']),

  experiences: defineTable({
    company: v.string(),
    role: v.string(),
    duration: v.string(),
    location: v.string(),
    description: v.string(),
    technologies: v.array(v.string()),
    logo: v.optional(v.string()),
    isCurrent: v.optional(v.boolean()),
    order: v.number(),
  }).index('by_order', ['order']),

  projects: defineTable({
    title: v.string(),
    description: v.string(),
    longDescription: v.optional(v.string()),
    categories: v.array(v.string()),
    techStack: v.array(v.string()),
    status: v.optional(
      v.union(v.literal('new'), v.literal('active'), v.literal('deprecated')),
    ),
    githubUrl: v.optional(v.string()),
    liveUrl: v.optional(v.string()),
    image: v.optional(v.string()),
    features: v.optional(v.array(v.string())),
    challenges: v.optional(v.array(v.string())),
    outcomes: v.optional(v.array(v.string())),
    timeline: v.optional(v.string()),
    teamSize: v.optional(v.string()),
    order: v.number(),
  }).index('by_order', ['order']),

  programmingLanguages: defineTable({
    name: v.string(),
    level: v.union(v.literal('expert'), v.literal('advanced'), v.literal('intermediate')),
    description: v.string(),
    logoUrl: v.optional(v.string()),
    order: v.number(),
  }).index('by_order', ['order']),

  technologies: defineTable({
    name: v.string(),
    category: v.string(),
    description: v.optional(v.string()),
    iconName: v.optional(v.string()),
    order: v.number(),
  }).index('by_category_order', ['category', 'order']),

  cloudProviders: defineTable({
    name: v.string(),
    order: v.number(),
  }).index('by_order', ['order']),

  certificates: defineTable({
    name: v.string(),
    providerId: v.id('cloudProviders'),
    image: v.string(),
    year: v.string(),
    description: v.optional(v.string()),
    issuer: v.optional(v.string()),
    credentialId: v.optional(v.string()),
    verificationUrl: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    order: v.number(),
  }).index('by_provider', ['providerId']).index('by_order', ['order']),

  aboutCategories: defineTable({
    name: v.string(),
    label: v.string(),
    color: v.string(),
    icon: v.string(),
    order: v.number(),
  }).index('by_order', ['order']),

  aboutItems: defineTable({
    categoryId: v.id('aboutCategories'),
    title: v.string(),
    subtitle: v.optional(v.string()),
    description: v.optional(v.string()),
    date: v.optional(v.string()),
    details: v.optional(v.array(v.string())),
    icon: v.string(),
    image: v.optional(v.string()),
    order: v.number(),
  }).index('by_category', ['categoryId']).index('by_order', ['order']),
});
