"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

interface AdminDeleteVisitorButtonProps {
  visitorId: string;
}

export function AdminDeleteVisitorButton({ visitorId }: AdminDeleteVisitorButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm("Delete this visitor record?");

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    const response = await fetch(`/api/admin/visitors/${visitorId}`, {
      method: "DELETE",
    });

    setIsDeleting(false);

    if (response.ok) {
      router.refresh();
    }
  }

  return (
    <Button
      className="h-9 rounded-2xl bg-destructive/10 px-4 text-xs font-bold text-destructive hover:bg-destructive/15"
      disabled={isDeleting}
      onClick={handleDelete}
      type="button"
      variant="ghost"
    >
      {isDeleting ? "Deleting" : "Delete"}
    </Button>
  );
}
