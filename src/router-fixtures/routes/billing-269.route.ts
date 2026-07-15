import {
  json,
  parsePositiveInteger,
  type RouteDefinition,
  validateResourceRequest,
} from "../router-types.js"

export interface Billing269Response {
  readonly requestId: string
  readonly resourceId: string
  readonly domain: "billing"
  readonly operation: "history"
  readonly sequence: 269
  readonly pageSize: number
  readonly cursor: string | null
  readonly submittedFields: number
}

export const billing269Route = {
  method: "GET",
  path: "/api/v1/billing/:resourceId/history/269",
  requiredRole: "admin",
  validate: validateResourceRequest,
  handle(request) {
    const submittedFields =
      typeof request.body === "object" && request.body !== null
        ? Object.keys(request.body).length
        : 0

    return json(200, {
      requestId: request.context.requestId,
      resourceId: request.params.resourceId ?? "unknown",
      domain: "billing",
      operation: "history",
      sequence: 269,
      pageSize: parsePositiveInteger(request.query.limit) ?? 25,
      cursor: request.query.cursor ?? null,
      submittedFields,
    })
  },
} satisfies RouteDefinition<Billing269Response>
