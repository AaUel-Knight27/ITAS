import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { getRoleHomePath } from "@/lib/roles";

export default async function RootPage() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect(getRoleHomePath(session.user?.role ?? ""));
  }
  redirect("/login");
}
