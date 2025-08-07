"use client";
import { useEffect, useRef } from "react";

export function MuJoCoViewer() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    iframe.onload = () => {
      console.log("🎬 Iframe loaded successfully");
    };

    iframe.onerror = (error) => {
      console.error("❌ Iframe failed to load:", error);
    };
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <iframe
        ref={iframeRef}
        src="/mujoco-demo.html"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
        allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone; midi; clipboard-read; clipboard-write"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          margin: 0,
          padding: 0,
          border: "none",
          display: "block",
        }}
        title="MuJoCo Physics Viewer"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

export default MuJoCoViewer;
