import { lookupPlaceFromCoords } from '@/lib/location/place';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latitude = Number(searchParams.get('lat'));
  const longitude = Number(searchParams.get('lon'));

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return Response.json({ error: 'Invalid coordinates' }, { status: 400 });
  }

  try {
    const place = await lookupPlaceFromCoords(latitude, longitude);
    return Response.json(place);
  } catch {
    return Response.json({ error: 'Could not resolve location name' }, { status: 502 });
  }
}
