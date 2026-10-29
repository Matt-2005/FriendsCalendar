import { getMeId, requireMe } from "@/lib/session";
import { countPendingFor } from "@/lib/queries";
import BottomNav from "../components/BottomNav";
import AppBoot from "../components/AppBoot";
import SimulationBanner from "../components/SimulationBanner";
import { ToastProvider } from "../components/Toast";
import PullToRefresh from "../components/PullToRefresh";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Les deux requêtes partent en même temps
  const [me, pending] = await Promise.all([
    requireMe(),
    getMeId().then((id) => (id ? countPendingFor(id) : 0)),
  ]);
  return (
    <ToastProvider>
      {me.simulatedBy && <SimulationBanner user={me} adminPseudo={me.simulatedBy.pseudo} />}
      {children}
      <BottomNav pendingCount={pending} />
      <AppBoot />
      <PullToRefresh />
    </ToastProvider>
  );
}
