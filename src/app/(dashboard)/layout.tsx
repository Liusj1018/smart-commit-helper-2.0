import { redirect } from "next/navigation";
import { isAuthenticated, getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAuthenticated();
  if (!authed) {
    redirect("/login");
  }

  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">Smart Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-sm text-muted-foreground" data-testid="user-email">
                {user.email}
              </span>
            )}
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="container py-6">{children}</main>
    </div>
  );
}