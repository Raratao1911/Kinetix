import React from "react";

export default function Brand({ inverse = false, lightBackground = "bg-sky" }) {
  const textColor = inverse ? "text-white" : "text-ink dark:text-darkTheme-text";
  const subtitleColor = inverse
    ? "text-white/70"
    : "text-slate-500 dark:text-darkTheme-muted";

  return (
    <div className="flex shrink-0 items-center gap-3">
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
      <span className={textColor}>
        <strong className="block text-2xl leading-none">KINETIX</strong>
        <span className={`mt-1 block text-sm font-medium ${subtitleColor}`}>
          Movimento inteligente
        </span>
      </span>
    </div>
  );
}
