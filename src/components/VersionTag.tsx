"use client";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function shortSha(sha?: string | null) {
  if (!sha) return null;
  return sha.slice(0, 7);
}

export default function VersionTag({ className }: { className?: string }) {
  const version = process.env.NEXT_PUBLIC_APP_VERSION || "dev";
  const commit = process.env.NEXT_PUBLIC_COMMIT_SHA || "";
  const sha = shortSha(commit);

  return (
    <div className={className}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="text-xs cursor-default select-none">
            {version}
          </Badge>
        </TooltipTrigger>
        {sha ? <TooltipContent sideOffset={4}>commit {sha}</TooltipContent> : null}
      </Tooltip>
    </div>
  );
}
