export function requestId(request: Request): string { return request.headers.get("x-request-id") ?? crypto.randomUUID(); }

export function ok<T>(data: T, status = 200): Response {
  return Response.json({ success: true, data }, { status });
}

export function fail(code: string, message: string, reqId: string, status: number, details: unknown = null): Response {
  return Response.json({ success: false, error: { code, message, details, requestId: reqId } }, { status, headers: { "x-request-id": reqId } });
}
