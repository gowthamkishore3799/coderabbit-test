import {
  json,
  parsePositiveInteger,
  type RouteDefinition,
  validateResourceRequest,
} from "../router-types.js"

export interface Users050Response {
  readonly requestId: string
  readonly resourceId: string
  readonly domain: "users"
  readonly operation: "metadata"
  readonly sequence: 50
  readonly pageSize: number
  readonly cursor: string | null
  readonly submittedFields: number
}

export const users050Route = {
  method: "POST",
  path: "/api/v1/users/:resourceId/metadata/050",
  requiredRole: "viewer",
  validate: validateResourceRequest,
  handle(request) {
    const submittedFields =
      typeof request.body === "object" && request.body !== null
        ? Object.keys(request.body).length
        : 0

    return json(200, {
      requestId: request.context.requestId,
      resourceId: request.params.resourceId ?? "unknown",
      domain: "users",
      operation: "metadata",
      sequence: 50,
      pageSize: parsePositiveInteger(request.query.limit) ?? 25,
      cursor: request.query.cursor ?? null,
      submittedFields,
    })
  },
} satisfies RouteDefinition<Users050Response>
