import { getPortfolioSnapshot } from '@/server/backend/portfolio';
export async function GET() {
  try {
    return Response.json(await getPortfolioSnapshot(), {
      headers: { 'Cache-Control': 'public, max-age=0, s-maxage=60' },
    });
  } catch {
    return Response.json(
      { error: 'Content temporarily unavailable' },
      { status: 503 },
    );
  }
}
