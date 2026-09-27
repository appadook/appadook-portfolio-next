import { getAuthServer } from '@/server/auth/session';
export async function GET(request: Request) {
  return getAuthServer().handler.GET(request);
}
export async function POST(request: Request) {
  return getAuthServer().handler.POST(request);
}
