"use client";

import Link from "next/link";
import { useSession, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export const NavAuth = () => {
  const { data: session } = useSession();

  if (session) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => signOut({ fetchOptions: { onSuccess: () => { window.location.href = "/sign-in"; } } })}
      >
        Sign Out
      </Button>
    );
  }

  return (
    <>
      <Button variant="ghost" size="sm" asChild>
        <Link href="/sign-in">Sign In</Link>
      </Button>
      <Button size="sm" asChild>
        <Link href="/sign-up">Get Started</Link>
      </Button>
    </>
  );
};
