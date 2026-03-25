import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";

export default async function RootPage() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect("/dashboard");
  }
  redirect("/login");
}
