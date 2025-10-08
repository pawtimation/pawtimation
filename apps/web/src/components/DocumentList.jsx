import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function DocumentList() {
  const [docs, setDocs] = useState([]);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) return console.error(error);

      const withLinks = await Promise.all(
        data.map(async (d) => {
          const { data: s } = await supabase.storage
            .from("documents")
            .createSignedUrl(d.path, 60);
          return { ...d, url: s?.signedUrl };
        }),
      );
      setDocs(withLinks);
    })();
  }, []);

  if (!docs.length) return <p>No documents yet.</p>;

  return (
    <ul style={{ padding: 0, display: "grid", gap: 8 }}>
      {docs.map((d) => (
        <li key={d.id} style={{ listStyle: "none" }}>
          <a href={d.url} target="_blank" rel="noreferrer">
            {d.kind || "document"} — {new Date(d.created_at).toLocaleString()}
          </a>
        </li>
      ))}
    </ul>
  );
}
