declare module 'geist/font/sans' {
  export const GeistSans: (options: { subsets: string[]; weight?: string[]; display?: string; variable?: string }) => {
    className: string;
  };
}

declare module 'geist/font/mono' {
  export function GeistMono(options: { subsets: string[]; weight?: string[]; display?: string; variable?: string }): {
    className: string;
  };
}
