import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TrustScoreProps {
  score: number; // 0.0 to 1.0
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabel?: boolean;
}

export function TrustScore({ score, size = "md", className, showLabel = true }: TrustScoreProps) {
  const percentage = Math.round(score * 100);
  
  // Color logic
  let colorClass = "text-yellow-500 bg-yellow-500";
  let statusText = "INCONCLUSIVE";
  
  if (score >= 0.8) {
    colorClass = "text-[hsl(var(--status-verified))] bg-[hsl(var(--status-verified))]";
    statusText = "VERIFIED";
  } else if (score <= 0.2) {
    colorClass = "text-[hsl(var(--status-debunked))] bg-[hsl(var(--status-debunked))]";
    statusText = "DEBUNKED";
  } else {
    statusText = "ACTIVE"; // Middle range is active debate
  }

  const sizes = {
    sm: "h-1.5 w-24 text-xs",
    md: "h-2.5 w-32 text-sm",
    lg: "h-4 w-full text-base",
  };

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {showLabel && (
        <div className="flex justify-between items-end">
          <span className={cn("font-mono font-bold tracking-wider", colorClass.split(' ')[0], size === 'lg' ? 'text-lg' : 'text-xs')}>
            {statusText}
          </span>
          <span className="font-mono text-muted-foreground font-mono-numbers">
            {percentage}% TRUST
          </span>
        </div>
      )}
      
      <div className={cn("w-full bg-secondary rounded-full overflow-hidden border border-border/50", sizes[size].split(' ')[0])}>
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn("h-full shadow-[0_0_10px_rgba(0,0,0,0.5)]", colorClass.split(' ')[1])}
        />
      </div>
    </div>
  );
}
