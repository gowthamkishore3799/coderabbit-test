import {
  json,
  parsePositiveInteger,
  type RouteDefinition,
  validateResourceRequest,
} from "../router-types.js"

export interface Audit340Response {
  readonly requestId: string
  readonly resourceId: string
  readonly domain: "audit"
  readonly operation: "metadata"
  readonly sequence: 340
  readonly pageSize: number
  readonly cursor: string | null
  readonly submittedFields: number
}

export const audit340Route = {
  method: "DELETE",
  path: "/api/v1/audit/:resourceId/metadata/340",
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
      sequence: 340,
      pageSize: parsePositiveInteger(request.query.limit) ?? 25,
      cursor: request.query.cursor ?? null,
      submittedFields,
    })
  },
} satisfies RouteDefinition<Audit340Response>
