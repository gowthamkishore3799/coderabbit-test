import {
  json,
  parsePositiveInteger,
  type RouteDefinition,
  validateResourceRequest,
} from "../router-types.js"

export interface Users023Response {
  readonly requestId: string
  readonly resourceId: string
  readonly domain: "users"
  readonly operation: "status"
  readonly sequence: 23
  readonly pageSize: number
  readonly cursor: string | null
  readonly submittedFields: number
}

export const users023Route = {
  method: "PATCH",
  path: "/api/v1/users/:resourceId/status/023",
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
      operation: "status",
      sequence: 23,
      pageSize: parsePositiveInteger(request.query.limit) ?? 25,
      cursor: request.query.cursor ?? null,
      submittedFields,
    })
  },
} satisfies RouteDefinition<Users023Response>
