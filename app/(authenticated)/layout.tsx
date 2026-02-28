import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Toaster } from "@/components/ui/toaster";
import { AuthenticatedShell } from "./authenticated-shell";

export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  return (
    <AuthenticatedShell
      userName={profile?.full_name || ""}
      email={profile?.email || user.email || ""}
    >
      {children}
      <Toaster />
    </AuthenticatedShell>
  );
}
