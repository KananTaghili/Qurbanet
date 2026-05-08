import { useEffect } from "react";
import { CommonActions } from "@react-navigation/native";
import { io } from "socket.io-client";
import api, { BASE_URL } from "../config/api";

const NOTICE_TEXT = "Bu kateqoriya deaktiv edildi";

const normalizeType = (value = "") => value.toString().trim().toLowerCase();

export default function useCategoryActiveGuard({
  animalType,
  navigation,
  enabled = true,
}) {
  useEffect(() => {
    if (!enabled || !animalType || !navigation) return;

    let disposed = false;
    let redirected = false;

    const redirectToHome = () => {
      if (disposed || redirected) return;
      redirected = true;
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: "Home",
              params: { categoryDeactivatedNotice: NOTICE_TEXT },
            },
          ],
        }),
      );
    };

    const checkActive = async () => {
      try {
        const res = await api.get("/orders/animals");
        const animals = res.data?.data?.animals || [];
        const exists = animals.some(
          (item) => normalizeType(item.type) === normalizeType(animalType),
        );

        if (!exists) {
          redirectToHome();
        }
      } catch (_) {
        // Keep flow resilient if network has intermittent issues.
      }
    };

    checkActive();

    const socketUrl = BASE_URL.replace(/\/api\/?$/, "");
    const socket = io(socketUrl, { transports: ["websocket"] });

    socket.on("category_updated", checkActive);

    return () => {
      disposed = true;
      socket.disconnect();
    };
  }, [animalType, enabled, navigation]);
}
