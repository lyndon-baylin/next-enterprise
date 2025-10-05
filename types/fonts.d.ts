// types/fonts.d.ts
// This is a shim file for Next.js’ built‑in font system (and Vercel’s geist/font/*) use virtual modules that don’t exist on disk,
// so ESLint (and especially TypeScript’s resolver) can’t find them unless you give it a hint.

// To make this work, we need to tell ESLint and TypeScript know these modules exist.
// The `types` directory must be defined in the `tsconfig.json` file `include` props for automatic type definition pickup.
declare module 'geist/font/sans' {
  export const GeistSans: {
    className: string;
    variable: string;
  };
}

declare module 'geist/font/mono' {
  export const GeistMono: {
    className: string;
    variable: string;
  };
}
