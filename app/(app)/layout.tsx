import { getMeId, requireMe } from "@/lib/session";
import { countPendingFor } from "@/lib/queries";
import BottomNav from "../components/BottomNav";
import AppBoot from "../components/AppBoot";
import { ToastProvider } from "../components/Toast";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Les deux requêtes partent en même temps
  const [, pending] = await Promise.all([
    requireMe(),
    getMeId().then((id) => (id ? countPendingFor(id) : 0)),
  ]);
  return (
    <ToastProvider>
      {children}
      <BottomNav pendingCount={pending} />
      <AppBoot />
    </ToastProvider>
  );
}
