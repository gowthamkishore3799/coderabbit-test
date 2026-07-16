import {
  json,
  parsePositiveInteger,
  type RouteDefinition,
  validateResourceRequest,
} from "../router-types.js"

export interface Inventory177Response {
  readonly requestId: string
  readonly resourceId: string
  readonly domain: "inventory"
  readonly operation: "activity"
  readonly sequence: 177
  readonly pageSize: number
  readonly cursor: string | null
  readonly submittedFields: number
}

export const inventory177Route = {
  method: "GET",
  path: "/api/v1/inventory/:resourceId/activity/177",
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
      operation: "activity",
      sequence: 177,
      pageSize: parsePositiveInteger(request.query.limit) ?? 25,
      cursor: request.query.cursor ?? null,
      submittedFields,
    })
  },
} satisfies RouteDefinition<Inventory177Response>
