import { wayAuthMatcher, wayAuthMiddleware } from "./src/lib/auth";

export default wayAuthMiddleware;

export const config = {
  matcher: wayAuthMatcher,
};
