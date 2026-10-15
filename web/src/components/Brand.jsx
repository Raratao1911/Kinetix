import React from "react";
import { Link } from "react-router-dom";

export default function Brand({ lightBackground = "bg-sky" }) {
  return (
    <Link to="/" aria-label="Ir para a página inicial" title="Página inicial" className="inline-flex w-fit shrink-0 rounded transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current">
      <span className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded ${lightBackground} dark:bg-transparent sm:h-36 sm:w-36`}>
        <img
          className="block h-[180%] w-[180%] max-w-none object-contain dark:hidden"
          src="/logolight.png"
          alt="Logo KINETIX"
        />
        <img
          className="hidden h-[180%] w-[180%] max-w-none object-contain dark:block dark:brightness-0 dark:invert"
          src="/logodark.png"
          alt=""
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}
