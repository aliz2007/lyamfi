import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppTestExperience } from "@/components/AppTestExperience";
import { APP_TEST } from "@/lib/app-test";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app-test")({
  ssr: false,
  beforeLoad: async () => {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) {
      throw redirect({
        to: "/auth",
        search: { mode: "login", redirect: "/app-test" },
      });
    }

    // Contrôle d'accès du preview : aucun contenu applicatif n'est monté pour
    // un compte non administrateur, même si l'URL est saisie directement.
    const roles = supabase.from("user_roles" as never) as unknown as {
      select: (columns: string) => {
        eq: (
          column: string,
          value: string,
        ) => {
          maybeSingle: () => Promise<{
            data: { role?: string } | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
    const { data: role, error: roleError } = await roles
      .select("role")
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (roleError || role?.role !== "admin") throw redirect({ to: "/dashboard" });
    return { appTestAdmin: auth.user };
  },
  head: () => ({
    meta: [
      { title: "App Test | Lyamfi" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
      { name: "theme-color", content: APP_TEST.background },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Lyamfi App Test" },
    ],
    links: [
      { rel: "manifest", href: "/app-test-manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/logo.png" },
    ],
  }),
  component: AppTestExperience,
});
