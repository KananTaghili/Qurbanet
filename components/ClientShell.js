"use client";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function ClientShell({ children }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <div className={`app-root${isHome ? " home-mode" : ""}`}>
      <Sidebar />
      <div className="app-body">
        {!isHome && <Topbar />}
        <main className="app-main">
          {children}
        </main>
      </div>
    </div>
  );
}
