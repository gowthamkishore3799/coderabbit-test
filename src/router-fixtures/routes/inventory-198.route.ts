import {
  json,
  parsePositiveInteger,
  type RouteDefinition,
  validateResourceRequest,
} from "../router-types.js"

export interface Inventory198Response {
  readonly requestId: string
  readonly resourceId: string
  readonly domain: "inventory"
  readonly operation: "status"
  readonly sequence: 198
  readonly pageSize: number
  readonly cursor: string | null
  readonly submittedFields: number
}

export const inventory198Route = {
  method: "POST",
  path: "/api/v1/inventory/:resourceId/status/198",
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
      operation: "status",
      sequence: 198,
      pageSize: parsePositiveInteger(request.query.limit) ?? 25,
      cursor: request.query.cursor ?? null,
      submittedFields,
    })
  },
} satisfies RouteDefinition<Inventory198Response>
