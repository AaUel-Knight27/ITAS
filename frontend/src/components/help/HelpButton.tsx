"use client";

import { useState } from "react";

import HelpSidebar from "@/components/help/HelpSidebar";

interface Props {
  pageId: string;
}

export default function HelpButton({ pageId }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-xl text-white shadow-lg transition-all hover:scale-110 hover:bg-blue-700 active:scale-95"
        aria-label="Open Help"
        title="Help"
      >
        ?
      </button>

      <HelpSidebar pageId={pageId} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
