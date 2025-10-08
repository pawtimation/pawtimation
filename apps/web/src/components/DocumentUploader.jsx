import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function DocumentUploader() {
  const [file, setFile] = useState(null);
  const [kind, setKind] = useState("other");
  const [msg, setMsg] = useState("");

  async function upload() {
    setMsg("");
    if (!file) return setMsg("Pick a file first.");

    const {
      data: { user },
      error: uErr,
    } = await supabase.auth.getUser();
    if (uErr || !user) return setMsg("Please sign in first.");

    const path = `u_${user.id}/${Date.now()}_${file.name}`;
    const { error: upErr } = await supabase.storage
      .from("documents")
      .upload(path, file, { upsert: false });
    if (upErr) return setMsg(`Upload failed: ${upErr.message}`);

    const { error: dbErr } = await supabase
      .from("documents")
      .insert({ owner_id: user.id, path, kind });
    if (dbErr) return setMsg(`DB error: ${dbErr.message}`);

    setFile(null);
    setKind("other");
    setMsg("Uploaded ✅");
  }

  return (
    <div style={{ display: "grid", gap: 8, maxWidth: 420 }}>
      <label>
        Document type:{" "}
        <select value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="id">Government ID</option>
          <option value="insurance">Insurance</option>
          <option value="vaccination">Vaccination</option>
          <option value="other">Other</option>
        </select>
      </label>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={upload}>Upload document</button>
      <small>{msg}</small>
    </div>
  );
}
