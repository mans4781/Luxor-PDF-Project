import { useState, useCallback } from "react";
import { Annotation } from "./annotationTypes";

export function useAnnotations() {
  const [annotations, setAnnotations] = useState<Map<string, Annotation>>(
    new Map()
  );

  const addAnnotation = useCallback((annotation: Annotation) => {
    setAnnotations((prev) => {
      const next = new Map(prev);
      next.set(annotation.id, annotation);
      return next;
    });
  }, []);

  const updateAnnotation = useCallback(
    (id: string, updates: Partial<Annotation>) => {
      setAnnotations((prev) => {
        const existing = prev.get(id);
        if (!existing) return prev;
        const next = new Map(prev);
        next.set(id, { ...existing, ...updates } as Annotation);
        return next;
      });
    },
    []
  );

  const removeAnnotation = useCallback((id: string) => {
    setAnnotations((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const getPageAnnotations = useCallback(
    (page: number) => {
      return Array.from(annotations.values()).filter((a) => a.page === page);
    },
    [annotations]
  );

  return {
    annotations,
    addAnnotation,
    updateAnnotation,
    removeAnnotation,
    getPageAnnotations,
  };
}
