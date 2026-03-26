import { redirect } from "next/navigation";
import { isAdminFromCookies } from "@/lib/auth";
import AdminClient from "@/prompt-client";

export default function AdminPage() {
  if (!isAdminFromCookies()) {
    redirect("/login");
  }

  return (
    <main>
      <div className="shell" style={{ width: "min(700px, 100%)" }}>
        <div className="header">
          <div className="title">Admin Panel</div>
          <div className="subtitle">Manage the system prompt and knowledge files.</div>
        </div>
        <AdminClient />
      </div>
    </main>
  );
}
