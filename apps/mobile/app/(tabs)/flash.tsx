import { fetchEventsByFilter } from "../../src/api/client";
import { EventListScreen } from "../../src/components/EventListScreen";

export default function FlashScreen() {
  return (
    <EventListScreen
      title="Flaş"
      subtitle="Son dakika, afet ve yüksek öncelikli gelişmeler"
      load={() => fetchEventsByFilter("flash")}
    />
  );
}
