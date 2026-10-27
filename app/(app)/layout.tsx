import { requireMe } from "@/lib/session";
import { countPendingFor } from "@/lib/queries";
import BottomNav from "../components/BottomNav";
import AppBoot from "../components/AppBoot";
import { ToastProvider } from "../components/Toast";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await requireMe();
  const pending = await countPendingFor(me.id);
  return (
    <ToastProvider>
      {children}
      <BottomNav pendingCount={pending} />
      <AppBoot />
    </ToastProvider>
  );
}
