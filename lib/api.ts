const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

export function apiUrl(path: string): string {
  return configuredApiUrl ? `${configuredApiUrl}${path}` : path;
}

export async function responseError(response: Response, fallback: string): Promise<Error> {
  const body = await response.text();

  try {
    const parsed = JSON.parse(body) as { detail?: string; message?: string };
    return new Error(parsed.detail || parsed.message || fallback);
  } catch {
    return new Error(
      body.trim().startsWith("<!DOCTYPE") || body.trim().startsWith("<html")
        ? `${fallback} (the API route returned an HTML ${response.status} page; check NEXT_PUBLIC_API_URL)`
        : body.trim() || `${fallback} (${response.status})`,
    );
  }
}
