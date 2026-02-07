import { useState, useEffect } from "react";
import { Clock, AlertCircle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CountdownTimerProps {
    targetDate: string | null;
    type: "resolution" | "expiry";
    status: string;
    onExpire?: () => void;
}

export function CountdownTimer({
    targetDate,
    type,
    status,
    onExpire,
}: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState<string>("");
    const [isExpired, setIsExpired] = useState(false);
    const [urgency, setUrgency] = useState<"safe" | "warning" | "danger">(
        "safe",
    );

    useEffect(() => {
        if (!targetDate || status !== "Active") {
            setIsExpired(true);
            return;
        }

        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const target = new Date(targetDate).getTime();
            const diff = target - now;

            if (diff <= 0) {
                setIsExpired(true);
                setTimeLeft("Expired");
                if (onExpire) onExpire();
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor(
                (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
            );
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            // Set urgency level
            const hoursLeft = diff / (1000 * 60 * 60);
            if (hoursLeft < 6) setUrgency("danger");
            else if (hoursLeft < 12) setUrgency("warning");
            else setUrgency("safe");

            if (days > 0) {
                setTimeLeft(`${days}d ${hours}h`);
            } else if (hours > 0) {
                setTimeLeft(`${hours}h ${minutes}m`);
            } else {
                setTimeLeft(`${minutes}m`);
            }
        };

        calculateTimeLeft();
        const interval = setInterval(calculateTimeLeft, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [targetDate, status, onExpire]);

    if (!targetDate || status !== "Active") {
        return null;
    }

    if (isExpired) {
        return (
            <Badge
                variant="outline"
                className="gap-1 text-muted-foreground border-muted-foreground/40"
            >
                <AlertCircle className="h-3 w-3" />
                {type === "resolution" ? "Ready to resolve" : "Event passed"}
            </Badge>
        );
    }

    const urgencyStyles = {
        safe: "text-emerald-600 border-emerald-600/40 bg-emerald-600/5",
        warning: "text-amber-600 border-amber-600/40 bg-amber-600/5",
        danger: "text-destructive border-destructive/40 bg-destructive/5",
    };

    const urgencyIcons = {
        safe: <Clock className="h-3 w-3" />,
        warning: <Clock className="h-3 w-3" />,
        danger: <AlertCircle className="h-3 w-3" />,
    };

    return (
        <Badge
            variant="outline"
            className={`gap-1 font-mono ${urgencyStyles[urgency]}`}
        >
            {urgencyIcons[urgency]}
            {type === "resolution" ? "Resolves in" : "Expires in"} {timeLeft}
        </Badge>
    );
}
