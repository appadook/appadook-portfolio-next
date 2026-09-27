import { convexSiteUrl } from "@/lib/convex-urls";
import { redirect } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "@portfolio/backend/convex/_generated/api";
import { AdminAuthForm } from "@/features/admin/components/AdminAuthForm";
import { getAdminSessionFromHeaders } from "@/server/auth/session";
export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getAdminSessionFromHeaders()) redirect("/admin");
  const { error } = await searchParams;
  let configured = false;
  let setupMessage =
    "Authentication is not configured for this deployment yet.";
  if (convexSiteUrl()) {
    try {
      const configuration = await fetchQuery(api.auth.configuration, {
        origin: process.env.NEXT_PUBLIC_SITE_URL,
      });
      configured = configuration.ready;
      if (
        configured &&
        (!configuration.siteUrl ||
          !process.env.NEXT_PUBLIC_SITE_URL ||
          new URL(configuration.siteUrl).origin !==
            new URL(process.env.NEXT_PUBLIC_SITE_URL).origin)
      ) {
        configured = false;
        setupMessage =
          process.env.NODE_ENV === "development"
            ? "Authentication origin mismatch: use http://localhost:3000 locally. The shared backend only accepts the configured local and production origins."
            : "Sign-in is unavailable because the authentication deployment does not match this site.";
      } else if (!configured)
        setupMessage =
          process.env.NODE_ENV === "development"
            ? "Local sign-in needs GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in your Convex development environment. Register http://localhost:3000/api/auth/callback/github as the callback, then refresh this page."
            : "GitHub sign-in is not configured for this deployment yet.";
    } catch {
      setupMessage =
        process.env.NODE_ENV === "development"
          ? "The authentication backend is unavailable. Run bun run dev:convex, then refresh this page."
          : "Sign-in is temporarily unavailable. Please try again later.";
    }
  }

  return (
    <>
      {error && (
        <p
          role="alert"
          className="fixed inset-x-0 top-4 text-center text-sm text-destructive"
        >
          Access was denied or sign-in expired. Use the approved GitHub account
          and try again.
        </p>
      )}
      <AdminAuthForm
        configured={configured}
        setupMessage={setupMessage}
        signInOrigin={process.env.NEXT_PUBLIC_SITE_URL}
      />
    </>
  );
}
