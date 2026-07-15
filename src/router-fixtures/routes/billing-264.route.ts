import {
  json,
  parsePositiveInteger,
  type RouteDefinition,
  validateResourceRequest,
} from "../router-types.js"

export interface Billing264Response {
  readonly requestId: string
  readonly resourceId: string
  readonly domain: "billing"
  readonly operation: "history"
  readonly sequence: 264
  readonly pageSize: number
  readonly cursor: string | null
  readonly submittedFields: number
}

export const billing264Route = {
  method: "DELETE",
  path: "/api/v1/billing/:resourceId/history/264",
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
      sequence: 264,
      pageSize: parsePositiveInteger(request.query.limit) ?? 25,
      cursor: request.query.cursor ?? null,
      submittedFields,
    })
  },
} satisfies RouteDefinition<Billing264Response>
