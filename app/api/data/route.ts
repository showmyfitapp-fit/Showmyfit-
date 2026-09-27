import { NextRequest, NextResponse } from 'next/server';
import { executeDataQuery, type DataRequest } from '@/lib/server/data';
import { getRequestUser, isAdminEmail } from '@/lib/server/request-user';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    const body = (await request.json()) as DataRequest;
    const data = await executeDataQuery(body, {
      userId: user?.id || null,
      isAdmin: user ? await isAdminEmail(user.email) : false,
    });
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Data request failed';
    const status = message.includes('Sign in')
      ? 401
      : message.includes('Admin') || message.includes('not allowed')
        ? 403
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
