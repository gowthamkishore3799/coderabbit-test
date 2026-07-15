import {
  json,
  parsePositiveInteger,
  type RouteDefinition,
  validateResourceRequest,
} from "../router-types.js"

export interface Audit292Response {
  readonly requestId: string
  readonly resourceId: string
  readonly domain: "audit"
  readonly operation: "activity"
  readonly sequence: 292
  readonly pageSize: number
  readonly cursor: string | null
  readonly submittedFields: number
}

export const audit292Route = {
  method: "DELETE",
  path: "/api/v1/audit/:resourceId/activity/292",
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
      operation: "activity",
      sequence: 292,
      pageSize: parsePositiveInteger(request.query.limit) ?? 25,
      cursor: request.query.cursor ?? null,
      submittedFields,
    })
  },
} satisfies RouteDefinition<Audit292Response>
