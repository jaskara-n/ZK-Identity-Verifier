import { FlaskConical } from "lucide-react";
import { IS_SANDBOX } from "@/lib/config";

export function SandboxBanner() {
  if (!IS_SANDBOX) return null;
  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-amber-500/10 border-b border-amber-500/30 text-amber-200 text-xs">
      <div className="container mx-auto px-6 py-1.5 flex items-center justify-center gap-2">
        <FlaskConical className="w-3.5 h-3.5" />
        <span>Sandbox environment — data is ephemeral and resets when the server restarts.</span>
      </div>
    </div>
  );
}
