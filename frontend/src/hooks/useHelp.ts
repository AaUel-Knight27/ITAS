"use client";

import { useCallback, useState } from "react";

export function useHelp() {
  const [isOpen, setIsOpen] = useState(false);

  const openHelp = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeHelp = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleHelp = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    isOpen,
    openHelp,
    closeHelp,
    toggleHelp,
  };
}
