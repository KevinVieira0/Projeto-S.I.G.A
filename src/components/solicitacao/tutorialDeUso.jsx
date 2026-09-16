"use client";

import { useState } from "react";

export default function Tooltip({ text }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen((prev) => !prev)}
        className="
          ml-1.5
          flex
          h-4
          w-4
          items-center
          justify-center
          rounded-full
          bg-slate-300
          text-[10px]
          font-bold
          text-white
          transition-colors
          hover:bg-[#0a3d7c]
        "
        aria-label="Ajuda"
      >
        ?
      </button>

      {open && (
        <div className="
          absolute
          bottom-full
          left-1/2
          z-20
          mb-2
          w-56
          -translate-x-1/2
          rounded-lg
          bg-[#0a3d7c]
          px-3
          py-2
          text-xs
          leading-5
          text-white
          shadow-lg
        ">
          {text}
          <div className="
            absolute
            left-1/2
            top-full
            h-2
            w-2
            -translate-x-1/2
            -translate-y-1/2
            rotate-45
            bg-[#0a3d7c]
          " />
        </div>
      )}
    </span>
  );
}