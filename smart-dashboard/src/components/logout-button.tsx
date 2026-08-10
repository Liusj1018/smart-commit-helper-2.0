"use client";

import { useFormStatus } from "react-dom";
import { logoutAction } from "@/app/(dashboard)/actions";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";

function LogoutSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending} aria-busy={pending}>
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <LogOut className="h-4 w-4" aria-hidden="true" />
      )}
      <span className="ml-2">退出</span>
    </Button>
  );
}

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <LogoutSubmit />
    </form>
  );
}