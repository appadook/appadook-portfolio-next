import { httpJson } from '@/lib/api/http';

export type AdminMeResponse = {
  user: {
    id: string;
    email: string;
  };
};

export function getAdminMe() {
  return httpJson<AdminMeResponse>('/api/auth/me');
}
