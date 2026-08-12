import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const authed = await isAuthenticated();
  redirect(authed ? "/dashboard" : "/login");
}