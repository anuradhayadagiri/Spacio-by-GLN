import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(30,64,175,0.18),transparent_26rem),radial-gradient(circle_at_82%_0%,rgba(249,115,22,0.14),transparent_24rem),radial-gradient(circle_at_50%_100%,rgba(16,185,129,0.1),transparent_28rem)]" />
      <div className="relative mx-auto min-h-screen w-full max-w-7xl bg-background/72 pb-24 shadow-[0_0_100px_-44px_rgba(30,64,175,0.45)] backdrop-blur-sm">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
