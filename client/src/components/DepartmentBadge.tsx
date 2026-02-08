import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Department metadata with colors
const DEPARTMENTS: Record<string, { name: string; color: string; bg: string }> = {
  SEECS:   { name: "School of Electrical Engineering & CS", color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/30" },
  NBS:     { name: "NUST Business School", color: "text-blue-400", bg: "bg-blue-500/15 border-blue-500/30" },
  S3H:     { name: "School of Social Sciences & Humanities", color: "text-purple-400", bg: "bg-purple-500/15 border-purple-500/30" },
  SCME:    { name: "School of Chemical & Materials Eng.", color: "text-orange-400", bg: "bg-orange-500/15 border-orange-500/30" },
  SMME:    { name: "School of Mechanical & Manufacturing Eng.", color: "text-red-400", bg: "bg-red-500/15 border-red-500/30" },
  NICE:    { name: "National Institute of Construction Eng.", color: "text-amber-400", bg: "bg-amber-500/15 border-amber-500/30" },
  CEME:    { name: "College of Electrical & Mechanical Eng.", color: "text-cyan-400", bg: "bg-cyan-500/15 border-cyan-500/30" },
  SNS:     { name: "School of Natural Sciences", color: "text-teal-400", bg: "bg-teal-500/15 border-teal-500/30" },
  SADA:    { name: "School of Art, Design & Architecture", color: "text-pink-400", bg: "bg-pink-500/15 border-pink-500/30" },
  IGIS:    { name: "Institute of Geographical Info. Systems", color: "text-lime-400", bg: "bg-lime-500/15 border-lime-500/30" },
  RCMS:    { name: "Research Centre for Modelling & Sim.", color: "text-indigo-400", bg: "bg-indigo-500/15 border-indigo-500/30" },
  NIPCONS: { name: "NUST Institute of Peace & Conflict Studies", color: "text-rose-400", bg: "bg-rose-500/15 border-rose-500/30" },
};

/**
 * Extract department code from a user ID like "SEECS-A7F4B2C9"
 */
export function getDeptFromUserId(userId: string): string | null {
  if (!userId) return null;
  const parts = userId.split("-");
  if (parts.length >= 2) {
    return parts[0];
  }
  return null;
}

/**
 * Get department display info
 */
export function getDeptInfo(deptCode: string) {
  return DEPARTMENTS[deptCode] || { name: deptCode, color: "text-muted-foreground", bg: "bg-muted/50 border-border" };
}

interface DepartmentBadgeProps {
  userId?: string;
  department?: string;
  size?: "sm" | "md";
  showTooltip?: boolean;
}

export function DepartmentBadge({ userId, department, size = "sm", showTooltip = true }: DepartmentBadgeProps) {
  const deptCode = department || (userId ? getDeptFromUserId(userId) : null);
  if (!deptCode) return null;

  const info = getDeptInfo(deptCode);

  const badge = (
    <Badge
      variant="outline"
      className={`${info.bg} ${info.color} font-mono tracking-wider border ${
        size === "sm" ? "text-[10px] px-1.5 py-0" : "text-xs px-2 py-0.5"
      }`}
    >
      {deptCode}
    </Badge>
  );

  if (!showTooltip) return badge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {badge}
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {info.name}
      </TooltipContent>
    </Tooltip>
  );
}
