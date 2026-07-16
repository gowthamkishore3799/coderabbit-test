import {
  json,
  parsePositiveInteger,
  type RouteDefinition,
  validateResourceRequest,
} from "../router-types.js"

export interface Orders120Response {
  readonly requestId: string
  readonly resourceId: string
  readonly domain: "orders"
  readonly operation: "metadata"
  readonly sequence: 120
  readonly pageSize: number
  readonly cursor: string | null
  readonly submittedFields: number
}

export const orders120Route = {
  method: "DELETE",
  path: "/api/v1/orders/:resourceId/metadata/120",
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
      operation: "metadata",
      sequence: 120,
      pageSize: parsePositiveInteger(request.query.limit) ?? 25,
      cursor: request.query.cursor ?? null,
      submittedFields,
    })
  },
} satisfies RouteDefinition<Orders120Response>
