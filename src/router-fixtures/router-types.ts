export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE"

export interface RouterRequest {
  readonly params: Readonly<Record<string, string | undefined>>
  readonly query: Readonly<Record<string, string | undefined>>
  readonly body: unknown
  readonly context: {
    readonly requestId: string
    readonly userId?: string
    readonly roles: readonly string[]
  }
}

export interface RouterResponse<TBody> {
  readonly status: number
  readonly headers: Readonly<Record<string, string>>
  readonly body: TBody
}

export interface RouteDefinition<TBody> {
  readonly method: HttpMethod
  readonly path: string
  readonly requiredRole: "viewer" | "editor" | "admin" | "auditor"
  readonly validate: (request: RouterRequest) => readonly string[]
  readonly handle: (request: RouterRequest) => RouterResponse<TBody>
}

export function json<TBody>(status: number, body: TBody): RouterResponse<TBody> {
  return {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
    body,
  }
}

export function parsePositiveInteger(value: string | undefined): number | null {
  if (value === undefined) return null

  const parsed = Number.parseInt(value, 10)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
}

export function validateResourceRequest(request: RouterRequest): readonly string[] {
  const errors: string[] = []
  if (!request.params.resourceId?.trim()) {
    errors.push("resourceId is required")
  }
  if (
    request.query.limit !== undefined &&
    parsePositiveInteger(request.query.limit) === null
  ) {
    errors.push("limit must be a positive integer")
  }
  return errors
}
