import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function AuthPanel() {
  const [email, setEmail] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signInMagic(e) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) alert(error.message);
    else alert("Check your email for the sign-in link.");
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  if (user) {
    return (
      <div>
        <span>Signed in as {user.email}</span>
        <button onClick={signOut}>Sign out</button>
      </div>
    );
  }

  return (
    <form onSubmit={signInMagic}>
      <input
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <button type="submit">Send magic link</button>
    </form>
  );
}
