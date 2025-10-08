import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
  const [name, setName] = useState("");
  const { login } = useAuth();
  const nav = useNavigate();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    login(name.trim());
    nav("/replay");
  }

  return (
    <main style={{ maxWidth: 420 }}>
      <h1>Log in</h1>
      <p style={{ opacity: 0.8 }}>
        (Dev-only login for now — enter any name. We’ll swap to real auth later.)
      </p>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <input
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: 8, borderRadius: 6, border: "1px solid #ccc" }}
        />
        <button type="submit">Continue</button>
      </form>
    </main>
  );
}
