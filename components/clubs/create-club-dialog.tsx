"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SpinnerIcon } from "@phosphor-icons/react";
import { createClub } from "@/lib/actions/club.actions";
import { createClubSchema, type CreateClubInput } from "@/lib/validations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const CreateClubDialog = ({
  triggerLabel = "New Club",
}: {
  triggerLabel?: string;
}) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateClubInput>({
    resolver: zodResolver(createClubSchema),
    defaultValues: {
      name: "",
      description: "",
      bookTitle: "",
      bookAuthor: "",
      totalPages: undefined,
      numberOfWeeks: undefined,
    },
  });

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      form.reset();
      setServerError(null);
    }
    setOpen(next);
  };

  const handleSubmit = form.handleSubmit((data) => {
    setServerError(null);
    startTransition(async () => {
      const res = await createClub(data);
      if ("error" in res) {
        setServerError(res.error);
      } else {
        handleOpenChange(false);
        router.push(`/clubs/${res.data.clubId}`);
      }
    });
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">{triggerLabel}</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-base font-semibold">
            New Reading Club
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Club Info */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Club Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. The Midnight Readers"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Description{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What will you read and discuss?"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* The Book */}
            <div className="border-t border-border pt-4 flex flex-col gap-4">
              <p className="font-mono text-xs text-muted-foreground tracking-[0.15em] uppercase">
                The Book
              </p>

              <FormField
                control={form.control}
                name="bookTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. The Shadow of the Wind"
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bookAuthor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Author *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Carlos Ruiz Zafón"
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Reading Plan */}
            <div className="border-t border-border pt-4 flex flex-col gap-4">
              <p className="font-mono text-xs text-muted-foreground tracking-[0.15em] uppercase">
                Reading Plan
              </p>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="totalPages"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Pages *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 320"
                          disabled={isPending}
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.valueAsNumber)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="numberOfWeeks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Weeks *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 4"
                          disabled={isPending}
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.valueAsNumber)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {serverError && (
              <p className="text-xs text-destructive border border-destructive/20 bg-destructive/5 px-3 py-2">
                {serverError}
              </p>
            )}

            <DialogFooter showCloseButton>
              <Button size="sm" type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <SpinnerIcon className="animate-spin" />
                    Creating…
                  </>
                ) : (
                  "Create Club"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
