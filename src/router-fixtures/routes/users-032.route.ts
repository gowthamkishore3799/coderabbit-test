import {
  json,
  parsePositiveInteger,
  type RouteDefinition,
  validateResourceRequest,
} from "../router-types.js"

export interface Users032Response {
  readonly requestId: string
  readonly resourceId: string
  readonly domain: "users"
  readonly operation: "activity"
  readonly sequence: 32
  readonly pageSize: number
  readonly cursor: string | null
  readonly submittedFields: number
}

export const users032Route = {
  method: "DELETE",
  path: "/api/v1/users/:resourceId/activity/032",
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
      operation: "activity",
      sequence: 32,
      pageSize: parsePositiveInteger(request.query.limit) ?? 25,
      cursor: request.query.cursor ?? null,
      submittedFields,
    })
  },
} satisfies RouteDefinition<Users032Response>
