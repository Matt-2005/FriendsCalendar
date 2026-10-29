import { requireGroup } from "@/lib/session";
import { countPendingFor } from "@/lib/queries";
import BottomNav from "../components/BottomNav";
import AppBoot from "../components/AppBoot";
import SimulationBanner from "../components/SimulationBanner";
import { ToastProvider } from "../components/Toast";
import PullToRefresh from "../components/PullToRefresh";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Pas encore dans un groupe → écran « Rejoindre un groupe »
  const { me, group } = await requireGroup();
  const pending = await countPendingFor(me.id, group.id);
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
