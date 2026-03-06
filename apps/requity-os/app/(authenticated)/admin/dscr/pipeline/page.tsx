import { redirect } from "next/navigation";

export default function DSCRPipelineRedirect() {
  redirect("/admin/models/dscr?tab=pipeline");
}
