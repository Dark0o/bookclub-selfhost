"use client";

import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

type Props = { userName?: string };

export const UserMenu = ({ userName }: Props) => (
  <Button
    variant="ghost"
    size="sm"
    className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
    onClick={() => signOut({ fetchOptions: { onSuccess: () => { window.location.href = "/sign-in"; } } })}
  >
    {userName ?? "Sign out"}
  </Button>
);
