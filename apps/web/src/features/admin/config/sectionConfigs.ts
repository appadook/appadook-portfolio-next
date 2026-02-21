import type { SelectOption } from '@/features/admin/types';

export const TECHNOLOGY_CATEGORY_OPTIONS: SelectOption[] = [
  { label: 'Frontend', value: 'Frontend' },
  { label: 'Backend', value: 'Backend' },
  { label: 'Database', value: 'Database' },
  { label: 'Mobile', value: 'Mobile' },
  { label: 'Testing & QA', value: 'Testing & QA' },
  { label: 'DevOps', value: 'DevOps' },
];

export const LANGUAGE_LEVEL_OPTIONS: SelectOption[] = [
  { label: 'Expert', value: 'expert' },
  { label: 'Advanced', value: 'advanced' },
  { label: 'Intermediate', value: 'intermediate' },
];

const PROJECT_STATUS_VALUES = ['new', 'active', 'deprecated'] as const;

export const PROJECT_STATUS_OPTIONS: SelectOption[] = PROJECT_STATUS_VALUES.map((status) => ({
  value: status,
  label: status.charAt(0).toUpperCase() + status.slice(1),
}));
