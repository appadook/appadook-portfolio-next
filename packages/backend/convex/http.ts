import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";
import { requestAuthOrigin } from "./lib/authOrigins";
const http = httpRouter();
// Retain the adapter's routes, header normalization and JWKS discovery while
// selecting credentials and cookie security for this request's approved origin.
authComponent.registerRoutes(http, (ctx) => {
  const auth = createAuth(ctx);
  return {
    ...auth,
    handler: async (request: Request) => {
      const origin = requestAuthOrigin(request);
      if (!origin)
        return Response.json(
          { code: "INVALID_ORIGIN", message: "Invalid origin" },
          { status: 403 },
        );
      return createAuth(ctx, origin).handler(request);
    },
  };
});
export default http;
