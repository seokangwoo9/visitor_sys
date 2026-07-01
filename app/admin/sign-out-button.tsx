"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);

    await authClient.signOut();

    router.replace("/login");
    router.refresh();
  }

  return (
    <Button
      className="h-12 w-full rounded-2xl"
      disabled={isSigningOut}
      onClick={handleSignOut}
      type="button"
      variant="outline"
    >
      <LogOut className="size-4" aria-hidden="true" />
      {isSigningOut ? "Signing out..." : "Sign out"}
    </Button>
  );
}
