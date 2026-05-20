import { fetchRadarEvents } from "../../src/api/client";
import { EventListScreen } from "../../src/components/EventListScreen";

export default function RadarScreen() {
  return (
    <EventListScreen
      title="Radar"
      subtitle="Önemli, doğrulanmış ve filtrelenmiş gelişmeler"
      load={fetchRadarEvents}
    />
  );
}
