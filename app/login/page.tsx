import LoginClient from "@/login-client";

export default function LoginPage() {
  return (
    <main>
      <div className="shell">
        <div className="header">
          <div className="title">Member Access</div>
          <div className="subtitle">Enter the community access password.</div>
        </div>
        <LoginClient />
      </div>
    </main>
  );
}
