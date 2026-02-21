'use client';

import { useMutation, useQuery } from 'convex/react';
import { adminApi } from '@/features/admin/api/convexAdmin';

export function useAdminDashboardController() {
  const bootstrap = useQuery(adminApi.getAdminBootstrap);
  const generateUploadUrl = useMutation(adminApi.generateUploadUrl);
  const resolveStorageUrl = useMutation(adminApi.resolveStorageUrl);
  const reorderExperiences = useMutation(adminApi.reorderExperiences);
  const reorderProjects = useMutation(adminApi.reorderProjects);
  const batchSaveTechnologies = useMutation(adminApi.batchSaveTechnologies);

  return {
    bootstrap,
    generateUploadUrl,
    resolveStorageUrl,
    reorderExperiences,
    reorderProjects,
    batchSaveTechnologies,
  };
}
