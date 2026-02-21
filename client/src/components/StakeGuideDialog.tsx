import React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info, Shield } from "lucide-react";

const STORAGE_KEY = "ctp_stake_guide_seen";

export function hasSeenStakeGuide(): boolean {
    if (typeof window === "undefined") return true;
    return !!localStorage.getItem(STORAGE_KEY);
}

export function markStakeGuideSeen(): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, "1");
}

interface StakeGuideDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** When true, "Got it" sets localStorage so guide is not shown again. When false (rules from navbar), just close. */
    isOnboarding?: boolean;
}

const stakeContent = (
    <>
        <p className="text-sm text-muted-foreground">
            You get points to use on the platform. When you vote on rumours or evidence, you can <strong>stake</strong> some of those points.
        </p>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-2">
            <li>If the rumour is later resolved and your vote matched the outcome, you earn bonus points.</li>
            <li>If your vote was wrong, you lose the points you staked.</li>
            <li>If the rumour stays inconclusive, your stake is returned — no gain or loss.</li>
        </ul>
        <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20 flex gap-2">
            <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
                <p className="font-medium text-foreground">Everything is anonymous</p>
                <p className="text-muted-foreground mt-0.5">
                    Your identity and votes are anonymous. There is no central admin — the system is self-maintained by algorithms and maths, so no one can see your personal data or link your activity to you.
                </p>
            </div>
        </div>
    </>
);

export function StakeGuideDialog({
    open,
    onOpenChange,
    isOnboarding = false,
}: StakeGuideDialogProps) {
    const handleClose = (value: boolean) => {
        if (!value && isOnboarding) markStakeGuideSeen();
        onOpenChange(value);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5 text-primary" />
                        {isOnboarding ? "How staking works" : "Rules & how it works"}
                    </DialogTitle>
                    <DialogDescription>
                        Staking and anonymity rules for Campus Truth Protocol.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 pt-1">
                    {stakeContent}
                </div>
                <DialogFooter>
                    <Button onClick={() => handleClose(false)}>
                        {isOnboarding ? "Got it" : "Close"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
