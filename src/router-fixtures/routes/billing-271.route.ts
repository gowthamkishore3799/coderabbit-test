import {
  json,
  parsePositiveInteger,
  type RouteDefinition,
  validateResourceRequest,
} from "../router-types.js"

export interface Billing271Response {
  readonly requestId: string
  readonly resourceId: string
  readonly domain: "billing"
  readonly operation: "summary"
  readonly sequence: 271
  readonly pageSize: number
  readonly cursor: string | null
  readonly submittedFields: number
}

export const billing271Route = {
  method: "PATCH",
  path: "/api/v1/billing/:resourceId/summary/271",
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
      operation: "summary",
      sequence: 271,
      pageSize: parsePositiveInteger(request.query.limit) ?? 25,
      cursor: request.query.cursor ?? null,
      submittedFields,
    })
  },
} satisfies RouteDefinition<Billing271Response>
