import { useEffect, useState } from "react";
import { apiClient } from "../services/apiClient.js";

export function useApiData(path) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function reload() {
    setLoading(true);
    setError("");
    try { setData(await apiClient(path)); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }

  useEffect(function loadOnPathChange() { reload(); }, [path]);
  return { data, loading, error, reload };
}
