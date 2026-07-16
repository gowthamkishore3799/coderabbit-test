import {
  json,
  parsePositiveInteger,
  type RouteDefinition,
  validateResourceRequest,
} from "../router-types.js"

export interface Orders099Response {
  readonly requestId: string
  readonly resourceId: string
  readonly domain: "orders"
  readonly operation: "history"
  readonly sequence: 99
  readonly pageSize: number
  readonly cursor: string | null
  readonly submittedFields: number
}

export const orders099Route = {
  method: "PATCH",
  path: "/api/v1/orders/:resourceId/history/099",
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
      sequence: 99,
      pageSize: parsePositiveInteger(request.query.limit) ?? 25,
      cursor: request.query.cursor ?? null,
      submittedFields,
    })
  },
} satisfies RouteDefinition<Orders099Response>
