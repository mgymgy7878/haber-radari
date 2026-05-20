import { fetchEventsByFilter } from "../../src/api/client";
import { EventListScreen } from "../../src/components/EventListScreen";

export default function NearbyScreen() {
  return (
    <EventListScreen
      title="Yakınımda"
      subtitle="Ev konumu ve yüksek konum ilgisi — arka plan GPS kapalı (MVP)"
      load={() => fetchEventsByFilter("nearby")}
    />
  );
}
