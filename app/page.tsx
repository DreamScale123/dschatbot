import { redirect } from "next/navigation";
import { isAuthedFromCookies } from "@/lib/auth";
import ChatClient from "@/chat-client";

export default function ChatPage() {
  if (!isAuthedFromCookies()) {
    redirect("/login");
  }

  return (
    <main>
      <ChatClient />
    </main>
  );
}
