"use client";
import { MuJoCoViewer } from "@/components/MuJoCoViewer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <h1 className="hidden text-4xl font-bold mb-8">MuJoCo WASM Viewer</h1>
      {/* <script type="module" src="/public/main.js"></script> */}
      <MuJoCoViewer />
    </main>
  );
}
