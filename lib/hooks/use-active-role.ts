import { useRoles } from "@/providers/role-provider";

export function useActiveRole() {
  const { activeRole, setActiveRole, roles } = useRoles();
  return { activeRole, setActiveRole, roles };
}
