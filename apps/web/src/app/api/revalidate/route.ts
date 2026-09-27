import { timingSafeEqual } from 'node:crypto';
import { revalidateTag } from 'next/cache';
export async function POST(request: Request) {
  const expected = process.env.REVALIDATE_SECRET;
  const supplied = request.headers
    .get('authorization')
    ?.replace(/^Bearer /, '');
  if (
    !expected ||
    !supplied ||
    Buffer.byteLength(expected) !== Buffer.byteLength(supplied) ||
    !timingSafeEqual(
      new TextEncoder().encode(expected),
      new TextEncoder().encode(supplied),
    )
  )
    return new Response('Unauthorized', { status: 401 });
  revalidateTag('portfolio', { expire: 0 });
  return Response.json({ revalidated: true });
}
