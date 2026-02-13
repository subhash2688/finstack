"use client";

import { LeadershipProfile } from "@/types/diagnostic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCircle, Sparkles, Linkedin } from "lucide-react";

interface ExecutiveTeamProps {
  leadership: LeadershipProfile;
  companyName?: string;
}

function getLinkedInUrl(exec: { name: string; linkedinUrl?: string }, companyName?: string): string {
  if (exec.linkedinUrl) return exec.linkedinUrl;
  const keywords = encodeURIComponent(`${exec.name}${companyName ? ` ${companyName}` : ""}`);
  return `https://www.linkedin.com/search/results/all/?keywords=${keywords}`;
}

export function ExecutiveTeam({ leadership, companyName }: ExecutiveTeamProps) {
  if (leadership.executives.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCircle className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Executive Team</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
            <Sparkles className="h-3 w-3 mr-1" />
            AI Analysis
          </Badge>
        </div>
        <p className="text-[10px] text-muted-foreground italic">
          {leadership.caveat}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {leadership.executives.map((exec, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                {exec.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium truncate">{exec.name}</p>
                  <a
                    href={getLinkedInUrl(exec, companyName)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700 transition-colors shrink-0"
                    title={exec.linkedinUrl ? "View LinkedIn profile" : "Search on LinkedIn"}
                  >
                    <Linkedin className="h-3.5 w-3.5" />
                  </a>
                </div>
                <p className="text-xs text-muted-foreground">{exec.title}</p>
                {exec.background && (
                  <p className="text-[10px] text-muted-foreground/70 mt-1 line-clamp-2">
                    {exec.background}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
