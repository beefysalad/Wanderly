import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import api from "@/lib/axios";
import { useJoinGroup } from "@/src/hooks/useGroups";
import { useSocket } from "@/src/hooks/useSocket";

export interface WhatsNewFeature {
  icon: string;
  title: string;
  description: string;
  color: string;
  bg: string;
}

/** Joins the group a visitor was invited to (the invite page parks the code in localStorage). */
function useInviteAutoJoin() {
  const joinGroup = useJoinGroup();

  useEffect(() => {
    if (localStorage.getItem("fromInvite") === "true" && localStorage.getItem("groupCode")) {
      joinGroup.mutateAsync({ groupCode: localStorage.getItem("groupCode")! });
      localStorage.removeItem("fromInvite");
      localStorage.removeItem("groupCode");
    }
  }, [joinGroup]);
}

/** Refreshes the group list when any group or trip changes elsewhere. */
function useGroupSocketRefresh() {
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    const refresh = () => queryClient.invalidateQueries({ queryKey: ["groups"] });
    socket.on("group:updated", refresh);
    socket.on("trip:created", refresh);

    return () => {
      socket.off("group:updated", refresh);
      socket.off("trip:created", refresh);
    };
  }, [socket, queryClient]);
}

/** Shows the "What's new" modal when the config version is newer than the one this user last saw. */
function useWhatsNew(user: User | null) {
  const [show, setShow] = useState(false);
  const [version, setVersion] = useState("");
  const [features, setFeatures] = useState<WhatsNewFeature[]>([]);

  useEffect(() => {
    if (!user) return;

    const check = async () => {
      try {
        const [syncRes, configRes] = await Promise.all([api.get("/sync"), api.get("/config/whats-new")]);
        const dbUser = syncRes.data.user;
        const config = configRes.data;

        if (config && config.version) {
          setVersion(config.version);
          setFeatures(config.features || []);
          if (dbUser && dbUser.lastSeenWhatsNew !== config.version) setShow(true);
        }
      } catch (err) {
        console.error("Failed to check WhatsNew status:", err);
      }
    };

    check();
  }, [user]);

  const close = async () => {
    setShow(false);
    if (!version) return;

    try {
      await api.patch("/user/profile", { lastSeenWhatsNew: version });
    } catch (err) {
      console.error("Failed to update WhatsNew status:", err);
    }
  };

  return { show, features, close };
}

export function useDashboardEffects(user: User | null) {
  useInviteAutoJoin();
  useGroupSocketRefresh();
  return useWhatsNew(user);
}
