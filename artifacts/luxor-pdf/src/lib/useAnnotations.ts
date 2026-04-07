import { useState, useCallback } from "react";
import { Annotation } from "./annotationTypes";

export function useAnnotations() {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);

  const addAnnotation = useCallback((ann: Annotation) => {
    setAnnotations(prev => [...prev, ann]);
  }, []);

  const updateAnnotation = useCallback((id: string, updates: Partial<Annotation>) => {
    setAnnotations(prev => prev.map(a => a.id === id ? { ...a, ...updates } as Annotation : a));
  }, []);

  const removeAnnotation = useCallback((id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
  }, []);

  const clearHighlights = useCallback(() => {
    setAnnotations(prev => prev.filter(a => a.type !== "highlight"));
  }, []);

  const getPageAnnotations = useCallback((page: number) => {
    return annotations.filter(a => a.page === page);
  }, [annotations]);

  return { annotations, addAnnotation, updateAnnotation, removeAnnotation, clearHighlights, getPageAnnotations };
}
