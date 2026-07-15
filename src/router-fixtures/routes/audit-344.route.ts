import {
  json,
  parsePositiveInteger,
  type RouteDefinition,
  validateResourceRequest,
} from "../router-types.js"

export interface Audit344Response {
  readonly requestId: string
  readonly resourceId: string
  readonly domain: "audit"
  readonly operation: "history"
  readonly sequence: 344
  readonly pageSize: number
  readonly cursor: string | null
  readonly submittedFields: number
}

export const audit344Route = {
  method: "DELETE",
  path: "/api/v1/audit/:resourceId/history/344",
  requiredRole: "auditor",
  validate: validateResourceRequest,
  handle(request) {
    const submittedFields =
      typeof request.body === "object" && request.body !== null
        ? Object.keys(request.body).length
        : 0

    return json(200, {
      requestId: request.context.requestId,
      resourceId: request.params.resourceId ?? "unknown",
      domain: "audit",
      operation: "history",
      sequence: 344,
      pageSize: parsePositiveInteger(request.query.limit) ?? 25,
      cursor: request.query.cursor ?? null,
      submittedFields,
    })
  },
} satisfies RouteDefinition<Audit344Response>
