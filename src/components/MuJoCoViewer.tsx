"use client";
import { useEffect, useRef } from "react";
import {
  MuJoCoDragAndDropProvider,
  MuJoCoDragAndDropContext,
} from "@/contexts/MuJoCoDragAndDropContext";
import { useContext } from "react";

function DragDropZone() {
  const { isDragging, setIsDragging, handleDrop } = useContext(
    MuJoCoDragAndDropContext
  ) ?? {
    isDragging: false,
    setIsDragging: () => {},
    handleDrop: async () => {},
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set isDragging to false if leaving the drop zone
    if (
      e.clientX < (window.innerWidth * 2) / 3 ||
      e.clientY <= 0 ||
      e.clientY >= window.innerHeight
    ) {
      setIsDragging(false);
    }
  };

  const handleDropEvent = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    // Convert React drag event to native drag event for the context
    const nativeEvent = new DragEvent("drop", {
      dataTransfer: e.dataTransfer,
      bubbles: true,
      cancelable: true,
    });
    await handleDrop(nativeEvent);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        width: "33.333vw",
        height: "100vh",
        zIndex: 1000,
        pointerEvents: "auto",
        background: isDragging ? "rgba(59, 130, 246, 0.10)" : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background 0.2s",
      }}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDropEvent}
    >
      {isDragging && (
        <div
          style={{
            background: "white",
            padding: 32,
            borderRadius: 12,
            boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
            textAlign: "center",
            border: "2px dashed #3b82f6",
            pointerEvents: "none",
            maxWidth: 320,
          }}
        >
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#3b82f6",
              marginBottom: 12,
            }}
          >
            Drop MuJoCo XML Files Here
          </div>
          <p style={{ color: "#374151" }}>Release to load your MuJoCo model</p>
        </div>
      )}
      {!isDragging && (
        <div
          style={{
            color: "#3b82f6",
            opacity: 0.7,
            fontWeight: 500,
            fontSize: 18,
            writingMode: "vertical-rl",
            textAlign: "center",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          Drag and drop a MuJoCo XML file here
        </div>
      )}
    </div>
  );
}

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

    // Listen for messages from the iframe
    const handleMessage = (event: MessageEvent) => {
      // Verify the message is from our iframe
      if (event.source !== iframe.contentWindow) {
        return;
      }

      console.log("📨 Received message from iframe:", event.data);

      // Handle different message types
      switch (event.data.type) {
        case "SCENE_LOADED":
          console.log("✅ Scene loaded successfully:", event.data.sceneName);
          break;
        case "ERROR":
          console.error("❌ Iframe error:", event.data.error);
          break;
        default:
          console.log("📨 Unknown message type:", event.data.type);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return (
    <MuJoCoDragAndDropProvider iframeRef={iframeRef}>
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          flexDirection: "row",
          position: "relative",
        }}
      >
        <div
          style={{
            width: "66.666vw",
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f8fafc",
            boxShadow: "2px 0 8px rgba(0,0,0,0.04)",
            position: "relative",
            zIndex: 1,
          }}
        >
          <iframe
            ref={iframeRef}
            src="/mujoco-demo.html"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
            allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone; midi; clipboard-read; clipboard-write"
            style={{
              width: "98%",
              height: "98%",
              margin: 0,
              padding: 0,
              border: "none",
              display: "block",
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
            }}
            title="MuJoCo Physics Viewer"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>
        <div
          style={{
            width: "33.333vw",
            height: "100vh",
            position: "relative",
            zIndex: 2,
          }}
        >
          <DragDropZone />
        </div>
      </div>
    </MuJoCoDragAndDropProvider>
  );
}

export default MuJoCoViewer;
