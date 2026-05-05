"use server"

import { redirect } from "next/navigation";

export async function signOut() {
  redirect("/auth/signout");
}
