"use client";

import { Building2, Landmark } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BorrowerEntityData, InvestingEntityData } from "../types";

function formatEntityType(type: string): string {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

interface EntitiesSidebarProps {
  borrowerEntities: BorrowerEntityData[];
  investingEntities: InvestingEntityData[];
}

export function EntitiesSidebar({
  borrowerEntities,
  investingEntities,
}: EntitiesSidebarProps) {
  return (
    <Card className="rounded-xl border-[#E5E5E7] bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
          <Building2 className="h-4 w-4" strokeWidth={1.5} />
          Associated Entities
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {borrowerEntities.length > 0 && (
          <div className="space-y-2">
            {borrowerEntities.length > 0 && investingEntities.length > 0 && (
              <p className="text-[10px] font-medium text-[#9A9A9A] uppercase tracking-wider">
                Borrower Entities
              </p>
            )}
            {borrowerEntities.map((entity) => (
              <div
                key={entity.id}
                className="flex items-start gap-2 rounded-lg border border-[#E5E5E7] p-2.5"
              >
                <Landmark
                  className="h-3.5 w-3.5 mt-0.5 text-[#6B6B6B] shrink-0"
                  strokeWidth={1.5}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#1A1A1A] truncate">
                    {entity.entity_name}
                  </p>
                  <p className="text-xs text-[#6B6B6B]">
                    {formatEntityType(entity.entity_type)}
                    {entity.state_of_formation && (
                      <span> &middot; {entity.state_of_formation}</span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {investingEntities.length > 0 && (
          <div className="space-y-2">
            {borrowerEntities.length > 0 && investingEntities.length > 0 && (
              <p className="text-[10px] font-medium text-[#9A9A9A] uppercase tracking-wider">
                Investing Entities
              </p>
            )}
            {investingEntities.map((entity) => (
              <div
                key={entity.id}
                className="flex items-start gap-2 rounded-lg border border-[#E5E5E7] p-2.5"
              >
                <Landmark
                  className="h-3.5 w-3.5 mt-0.5 text-[#6B6B6B] shrink-0"
                  strokeWidth={1.5}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#1A1A1A] truncate">
                    {entity.entity_name}
                  </p>
                  <p className="text-xs text-[#6B6B6B]">
                    {formatEntityType(entity.entity_type)}
                    {entity.state_of_formation && (
                      <span> &middot; {entity.state_of_formation}</span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
