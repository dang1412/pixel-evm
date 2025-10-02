// global.d.ts
declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement | string,
        options: {
          sitekey: string;
          size?: "normal" | "compact" | "invisible";
          callback?: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
        }
      ) => string; // returns widgetId
      execute: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}
export {};
