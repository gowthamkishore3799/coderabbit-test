import {
  json,
  parsePositiveInteger,
  type RouteDefinition,
  validateResourceRequest,
} from "../router-types.js"

export interface Billing211Response {
  readonly requestId: string
  readonly resourceId: string
  readonly domain: "billing"
  readonly operation: "summary"
  readonly sequence: 211
  readonly pageSize: number
  readonly cursor: string | null
  readonly submittedFields: number
}

export const billing211Route = {
  method: "PATCH",
  path: "/api/v1/billing/:resourceId/summary/211",
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
      sequence: 211,
      pageSize: parsePositiveInteger(request.query.limit) ?? 25,
      cursor: request.query.cursor ?? null,
      submittedFields,
    })
  },
} satisfies RouteDefinition<Billing211Response>
