import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { parseTabParam, type TabType } from "./tripTabs";

/** Active trip tab, synced from and back to the `?tab=` query param. */
export function useTripTab(groupId: string, tripId: string) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>("daily");

  useEffect(() => {
    const tab = parseTabParam(searchParams.get("tab"));
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);

    router.replace(`/group/${groupId}/trip/${tripId}?tab=${tab}`, {
      scroll: false,
    });
  };

  return { activeTab, handleTabChange };
}
