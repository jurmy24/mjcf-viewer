"use client";
import { MuJoCoViewer } from "@/components/MuJoCoViewer";

export default function Home() {
  return (
    <main
      style={{
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        overflow: "hidden",
      }}
    >
      <h1 className="hidden text-4xl font-bold mb-8">MuJoCo WASM Viewer</h1>
      {/* <script type="module" src="/public/main.js"></script> */}
      <MuJoCoViewer />
    </main>
  );
}
