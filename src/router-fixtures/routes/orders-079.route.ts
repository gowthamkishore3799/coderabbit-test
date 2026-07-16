import {
  json,
  parsePositiveInteger,
  type RouteDefinition,
  validateResourceRequest,
} from "../router-types.js"

export interface Orders079Response {
  readonly requestId: string
  readonly resourceId: string
  readonly domain: "orders"
  readonly operation: "history"
  readonly sequence: 79
  readonly pageSize: number
  readonly cursor: string | null
  readonly submittedFields: number
}

export const orders079Route = {
  method: "PATCH",
  path: "/api/v1/orders/:resourceId/history/079",
  requiredRole: "editor",
  validate: validateResourceRequest,
  handle(request) {
    const submittedFields =
      typeof request.body === "object" && request.body !== null
        ? Object.keys(request.body).length
        : 0

    return json(200, {
      requestId: request.context.requestId,
      resourceId: request.params.resourceId ?? "unknown",
      domain: "orders",
      operation: "history",
      sequence: 79,
      pageSize: parsePositiveInteger(request.query.limit) ?? 25,
      cursor: request.query.cursor ?? null,
      submittedFields,
    })
  },
} satisfies RouteDefinition<Orders079Response>
