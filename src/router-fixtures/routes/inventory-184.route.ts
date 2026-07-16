import {
  json,
  parsePositiveInteger,
  type RouteDefinition,
  validateResourceRequest,
} from "../router-types.js"

export interface Inventory184Response {
  readonly requestId: string
  readonly resourceId: string
  readonly domain: "inventory"
  readonly operation: "history"
  readonly sequence: 184
  readonly pageSize: number
  readonly cursor: string | null
  readonly submittedFields: number
}

export const inventory184Route = {
  method: "DELETE",
  path: "/api/v1/inventory/:resourceId/history/184",
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
      operation: "history",
      sequence: 184,
      pageSize: parsePositiveInteger(request.query.limit) ?? 25,
      cursor: request.query.cursor ?? null,
      submittedFields,
    })
  },
} satisfies RouteDefinition<Inventory184Response>
