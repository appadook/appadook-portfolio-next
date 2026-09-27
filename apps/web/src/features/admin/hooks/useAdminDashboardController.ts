'use client';

import { useMemo } from 'react';
import { useAction, useMutation, useQuery } from 'convex/react';
import { adminApi } from '@/features/admin/api/convexAdmin';

import type { BootstrapData } from '../types';
export function useAdminDashboardController(initialData: BootstrapData) {
  const bootstrap = useQuery(adminApi.getAdminBootstrap) ?? initialData;
  const generateUploadUrl = useMutation(adminApi.generateUploadUrl);
  const resolveStorageUrl = useAction(adminApi.resolveStorageUrl);
  const reorderExperiences = useMutation(adminApi.reorderExperiences);
  const reorderProjects = useMutation(adminApi.reorderProjects);
  const batchSaveTechnologies = useMutation(adminApi.batchSaveTechnologies);

  return useMemo(
    () => ({
      bootstrap,
      generateUploadUrl,
      resolveStorageUrl,
      reorderExperiences,
      reorderProjects,
      batchSaveTechnologies,
    }),
    [
      bootstrap,
      batchSaveTechnologies,
      generateUploadUrl,
      reorderExperiences,
      reorderProjects,
      resolveStorageUrl,
    ],
  );
}
