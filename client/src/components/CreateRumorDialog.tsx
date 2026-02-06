import { useState } from "react";
import { useCreateRumor } from "@/hooks/use-rumors";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { insertRumorSchema } from "@shared/schema";

const formSchema = insertRumorSchema;
type FormData = z.infer<typeof formSchema>;

export function CreateRumorDialog() {
  const [open, setOpen] = useState(false);
  const createRumor = useCreateRumor();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
    },
  });

  const onSubmit = (data: FormData) => {
    createRumor.mutate(data, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
          <Plus className="h-4 w-4" />
          Submit Rumor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md border-border/50 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle>Submit Anonymous Rumor</DialogTitle>
          <DialogDescription>
            Share news or claims about campus events. Your identity is cryptographically hashed and not stored with the content.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <Label>Claim Content</Label>
                  <FormControl>
                    <Textarea 
                      placeholder="e.g. The library is closing early next week due to..." 
                      className="min-h-[120px] resize-none font-mono text-sm bg-secondary/50 border-border focus:ring-primary/20"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={createRumor.isPending}
                className="w-full font-semibold"
              >
                {createRumor.isPending ? "Encrypting & Submitting..." : "Submit to Protocol"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
