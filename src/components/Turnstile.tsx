import {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";

export interface TurnstileRef {
  execute: () => Promise<string>;
  remove: () => void;
}

const siteKey = "0x4AAAAAAB4Sxx2XrMusRDf6";

const Turnstile = forwardRef<TurnstileRef, {}>(
  ({}, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);

    useEffect(() => {
      // Load Turnstile script if not already loaded
      if (!document.querySelector("#cf-turnstile")) {
        const script = document.createElement("script");
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        script.id = "cf-turnstile";
        document.body.appendChild(script);
      }
    }, []);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      execute: () => {
        return new Promise<string>((res, rej) => {
          if (window.turnstile && containerRef.current) {
            widgetIdRef.current = window.turnstile.render(containerRef.current, {
              sitekey: siteKey,
              size: "normal",
              callback: (token) => res(token),
              "error-callback": () => rej('error'),
              "expired-callback": () => rej('expired'),
            });
          } else {
            rej('turnstile not loaded');
          }
        })
        
      },
      remove: () => {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.remove(widgetIdRef.current);
        }
      },
    }));

    return (
      <div
        ref={containerRef}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      ></div>
    );
  }
);

Turnstile.displayName = "Turnstile";
export default Turnstile;
