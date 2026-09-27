import { createHmac } from 'node:crypto';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@portfolio/backend/convex/_generated/api';
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (
    origin !== new URL(process.env.NEXT_PUBLIC_SITE_URL || request.url).origin
  )
    return Response.json({ error: 'Invalid request origin.' }, { status: 403 });
  const secret = process.env.CONTACT_INGEST_SECRET;
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!secret || !url)
    return Response.json(
      {
        error:
          'Messaging is temporarily unavailable. Please use the email link.',
      },
      { status: 503 },
    );
  if (Number(request.headers.get('content-length')) > 10000)
    return new Response('Message too large', { status: 413 });
  try {
    const body = await request.text();
    if (body.length > 10000)
      return new Response('Message too large', { status: 413 });
    const data = JSON.parse(body) as Record<string, unknown>;
    if (data.website)
      return Response.json(
        { error: 'Unable to accept this submission.' },
        { status: 400 },
      );
    if (
      typeof data.name !== 'string' ||
      typeof data.email !== 'string' ||
      typeof data.message !== 'string'
    )
      return Response.json({ error: 'Complete all fields.' }, { status: 400 });
    // Vercel supplies this header; other hosts conservatively share a rate bucket.
    const ip = process.env.VERCEL
      ? (request.headers.get('x-vercel-forwarded-for') ?? 'unknown')
      : 'shared';
    const rateKey = createHmac('sha256', secret).update(ip).digest('hex');
    await new ConvexHttpClient(url).mutation(api.contact.submit, {
      secret,
      rateKey,
      name: data.name,
      email: data.email,
      message: data.message,
    });
    return Response.json({ accepted: true }, { status: 202 });
  } catch {
    return Response.json(
      {
        error:
          'Your message could not be accepted. Check the fields, or try again later.',
      },
      { status: 400 },
    );
  }
}
