declare module 'madge' {
  interface MadgeConfig {
    baseDir?: string;
    includeNpm?: boolean;
    fileExtensions?: string[];
    tsConfig?: string;
    excludeRegExp?: (string | RegExp)[];
  }

  interface MadgeInstance {
    circular(): string[][];
  }

  function madge(path: string, config?: MadgeConfig): Promise<MadgeInstance>;

  export = madge;
}
