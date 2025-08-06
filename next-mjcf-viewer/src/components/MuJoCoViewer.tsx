"use client";

import { useEffect, useRef } from "react";
import { MuJoCoDemo } from "@/lib/mujoco-demo";

export function MuJoCoViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const demoRef = useRef<MuJoCoDemo | null>(null);

  useEffect(() => {
    if (!containerRef.current || demoRef.current) return;

    const initDemo = async () => {
      try {
        demoRef.current = new MuJoCoDemo(containerRef.current!);
        await demoRef.current.init();
      } catch (error) {
        console.error("Failed to initialize MuJoCo demo:", error);
      }
    };

    initDemo();

    // Cleanup on unmount
    return () => {
      if (demoRef.current) {
        demoRef.current.dispose();
        demoRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        margin: 0,
        touchAction: "none",
        userSelect: "none",
      }}
    />
  );
}
