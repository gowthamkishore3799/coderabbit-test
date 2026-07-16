import {
  json,
  parsePositiveInteger,
  type RouteDefinition,
  validateResourceRequest,
} from "../router-types.js"

export interface Inventory146Response {
  readonly requestId: string
  readonly resourceId: string
  readonly domain: "inventory"
  readonly operation: "summary"
  readonly sequence: 146
  readonly pageSize: number
  readonly cursor: string | null
  readonly submittedFields: number
}

export const inventory146Route = {
  method: "POST",
  path: "/api/v1/inventory/:resourceId/summary/146",
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
      domain: "inventory",
      operation: "summary",
      sequence: 146,
      pageSize: parsePositiveInteger(request.query.limit) ?? 25,
      cursor: request.query.cursor ?? null,
      submittedFields,
    })
  },
} satisfies RouteDefinition<Inventory146Response>
