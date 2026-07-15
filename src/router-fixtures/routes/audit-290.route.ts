import {
  json,
  parsePositiveInteger,
  type RouteDefinition,
  validateResourceRequest,
} from "../router-types.js"

export interface Audit290Response {
  readonly requestId: string
  readonly resourceId: string
  readonly domain: "audit"
  readonly operation: "metadata"
  readonly sequence: 290
  readonly pageSize: number
  readonly cursor: string | null
  readonly submittedFields: number
}

export const audit290Route = {
  method: "POST",
  path: "/api/v1/audit/:resourceId/metadata/290",
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
      operation: "metadata",
      sequence: 290,
      pageSize: parsePositiveInteger(request.query.limit) ?? 25,
      cursor: request.query.cursor ?? null,
      submittedFields,
    })
  },
} satisfies RouteDefinition<Audit290Response>
