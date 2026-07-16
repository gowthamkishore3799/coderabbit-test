import {
  json,
  parsePositiveInteger,
  type RouteDefinition,
  validateResourceRequest,
} from "../router-types.js"

export interface Orders134Response {
  readonly requestId: string
  readonly resourceId: string
  readonly domain: "orders"
  readonly operation: "history"
  readonly sequence: 134
  readonly pageSize: number
  readonly cursor: string | null
  readonly submittedFields: number
}

export const orders134Route = {
  method: "POST",
  path: "/api/v1/orders/:resourceId/history/134",
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
      sequence: 134,
      pageSize: parsePositiveInteger(request.query.limit) ?? 25,
      cursor: request.query.cursor ?? null,
      submittedFields,
    })
  },
} satisfies RouteDefinition<Orders134Response>
