type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { nullValue: null }
  | { timestampValue: string }
  | { arrayValue: { values?: FirestoreValue[] } }
  | { mapValue: { fields?: Record<string, FirestoreValue> } };

function parseValue(value: FirestoreValue): unknown {
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return parseInt(value.integerValue, 10);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('nullValue' in value) return null;
  if ('timestampValue' in value) return value.timestampValue;
  if ('arrayValue' in value) {
    return (value.arrayValue.values || []).map(parseValue);
  }
  if ('mapValue' in value) {
    return parseFields(value.mapValue.fields || {});
  }
  return null;
}

function parseFields(fields: Record<string, FirestoreValue>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    result[key] = parseValue(value);
  }
  return result;
}

function getProjectId(): string {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID is not configured');
  }
  return projectId;
}

function getApiKey(): string | undefined {
  return process.env.NEXT_PUBLIC_FIREBASE_API_KEY || undefined;
}

function withKey(url: string): string {
  const apiKey = getApiKey();
  if (!apiKey) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}key=${apiKey}`;
}

export async function serverListCollection(
  collectionId: string,
  revalidate = 3600
): Promise<Record<string, unknown>[]> {
  const projectId = getProjectId();
  const url = withKey(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionId}`
  );

  const response = await fetch(url, { next: { revalidate } });
  if (!response.ok) {
    console.error(`Firestore list failed for ${collectionId}:`, response.status);
    return [];
  }

  const payload = await response.json();
  if (!payload.documents) return [];

  return payload.documents.map((doc: { name: string; fields: Record<string, FirestoreValue> }) => {
    const id = doc.name.split('/').pop() || '';
    return { id, ...parseFields(doc.fields) };
  });
}

export async function serverGetDocument(
  collectionId: string,
  docId: string,
  revalidate = 3600
): Promise<Record<string, unknown> | null> {
  const projectId = getProjectId();
  const url = withKey(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionId}/${encodeURIComponent(docId)}`
  );

  const response = await fetch(url, { next: { revalidate } });
  if (!response.ok) return null;

  const payload = await response.json();
  return { id: docId, ...parseFields(payload.fields || {}) };
}

export async function serverQueryProducts(revalidate = 3600): Promise<Record<string, unknown>[]> {
  const projectId = getProjectId();
  const url = withKey(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`
  );

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'products' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'status' },
            op: 'EQUAL',
            value: { stringValue: 'active' },
          },
        },
        limit: 2000,
      },
    }),
    next: { revalidate },
  });

  if (!response.ok) {
    console.error('Firestore product query failed:', response.status);
    return [];
  }

  const rows = await response.json();
  return (rows || [])
    .filter((row: { document?: { name: string; fields: Record<string, FirestoreValue> } }) => row.document)
    .map((row: { document: { name: string; fields: Record<string, FirestoreValue> } }) => {
      const id = row.document.name.split('/').pop() || '';
      return { id, ...parseFields(row.document.fields) };
    });
}
