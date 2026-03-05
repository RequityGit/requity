import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DialerSessionClient } from "./client";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { listId: string };
}

export default async function DialerSessionPage({ params }: PageProps) {
  const { listId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <DialerSessionClient listId={listId} />;
}
