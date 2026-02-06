import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border bg-card/50 backdrop-blur-sm">
        <CardContent className="pt-6 flex flex-col items-center text-center">
          <div className="rounded-full bg-destructive/10 p-4 mb-4">
            <ShieldAlert className="h-12 w-12 text-destructive" />
          </div>
          
          <h1 className="text-2xl font-bold mb-2">404 Error</h1>
          <p className="text-muted-foreground mb-6">
            The requested resource could not be found. This rumor may have been redacted or never existed.
          </p>
          
          <Link href="/">
            <Button className="w-full">Return to Feed</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
