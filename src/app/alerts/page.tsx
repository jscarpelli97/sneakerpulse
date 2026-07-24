import { redirect } from "next/navigation";

export const metadata = {
  title: "Alerts",
  description: "Alerts offering removed — browse Markets instead.",
};

/** Alerts offering retired from the product surface. */
export default function AlertsRedirectPage() {
  redirect("/markets");
}
