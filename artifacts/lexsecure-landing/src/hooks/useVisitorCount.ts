import { useState, useEffect, useRef } from "react";

export function useVisitorCount() {
  const [count, setCount] = useState<number | null>(null);
  const incremented = useRef(false);

  useEffect(() => {
    if (incremented.current) return;
    incremented.current = true;

    fetch("/api/visitors/increment", { method: "POST" })
      .then((r) => r.json())
      .then((data) => setCount(data.count))
      .catch(() => {
        fetch("/api/visitors")
          .then((r) => r.json())
          .then((data) => setCount(data.count))
          .catch(() => {});
      });
  }, []);

  return count;
}
