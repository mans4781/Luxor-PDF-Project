import { useState, useCallback, useRef } from "react";
import { Annotation } from "./annotationTypes";

export function useAnnotations() {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const historyRef = useRef<Annotation[][]>([]);

  const addAnnotation = useCallback((ann: Annotation) => {
    setAnnotations(prev => {
      historyRef.current.push([...prev]);
      return [...prev, ann];
    });
  }, []);

  const updateAnnotation = useCallback((id: string, updates: Partial<Annotation>) => {
    setAnnotations(prev => {
      historyRef.current.push([...prev]);
      return prev.map(a => a.id === id ? { ...a, ...updates } as Annotation : a);
    });
  }, []);

  const removeAnnotation = useCallback((id: string) => {
    setAnnotations(prev => {
      historyRef.current.push([...prev]);
      return prev.filter(a => a.id !== id);
    });
  }, []);

  const clearHighlights = useCallback(() => {
    setAnnotations(prev => {
      historyRef.current.push([...prev]);
      return prev.filter(a => a.type !== "highlight");
    });
  }, []);

  const undo = useCallback(() => {
    const prev = historyRef.current.pop();
    if (prev !== undefined) {
      setAnnotations(prev);
    }
  }, []);

  const getPageAnnotations = useCallback((page: number) => {
    return annotations.filter(a => a.page === page);
  }, [annotations]);

  return { annotations, addAnnotation, updateAnnotation, removeAnnotation, clearHighlights, undo, getPageAnnotations };
}
