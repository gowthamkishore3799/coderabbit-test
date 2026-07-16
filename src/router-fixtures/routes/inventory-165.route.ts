import {
  json,
  parsePositiveInteger,
  type RouteDefinition,
  validateResourceRequest,
} from "../router-types.js"

export interface Inventory165Response {
  readonly requestId: string
  readonly resourceId: string
  readonly domain: "inventory"
  readonly operation: "metadata"
  readonly sequence: 165
  readonly pageSize: number
  readonly cursor: string | null
  readonly submittedFields: number
}

export const inventory165Route = {
  method: "GET",
  path: "/api/v1/inventory/:resourceId/metadata/165",
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
      operation: "metadata",
      sequence: 165,
      pageSize: parsePositiveInteger(request.query.limit) ?? 25,
      cursor: request.query.cursor ?? null,
      submittedFields,
    })
  },
} satisfies RouteDefinition<Inventory165Response>
