import { fetchEventsByFilter } from "../../src/api/client";
import { EventListScreen } from "../../src/components/EventListScreen";

export default function FinanceScreen() {
  return (
    <EventListScreen
      title="Finans"
      subtitle="Piyasa etkili haberler, KAP, TCMB, küresel merkez bankaları"
      load={() => fetchEventsByFilter("finance")}
    />
  );
}
