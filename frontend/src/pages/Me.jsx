import { useEffect, useState } from "react";
import api from "../api";

export default function Me() {
  const [data, setData] = useState(null);
  useEffect(() => {
    api.get("/api/auth/me")
      .then((r) => setData(r.data))
      .catch((e) => setData({ error: e.message }));
  }, []);
  return (
    <div style={{ padding: 24 }}>
      <h2>/api/auth/me 결과</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
