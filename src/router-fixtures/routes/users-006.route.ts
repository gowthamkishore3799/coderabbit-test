import {
  json,
  parsePositiveInteger,
  type RouteDefinition,
  validateResourceRequest,
} from "../router-types.js"

export interface Users006Response {
  readonly requestId: string
  readonly resourceId: string
  readonly domain: "users"
  readonly operation: "summary"
  readonly sequence: 6
  readonly pageSize: number
  readonly cursor: string | null
  readonly submittedFields: number
}

export const users006Route = {
  method: "POST",
  path: "/api/v1/users/:resourceId/summary/006",
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
      operation: "summary",
      sequence: 6,
      pageSize: parsePositiveInteger(request.query.limit) ?? 25,
      cursor: request.query.cursor ?? null,
      submittedFields,
    })
  },
} satisfies RouteDefinition<Users006Response>
