import dynamic from "next/dynamic";
import Loader from "@/components/ui/Loader";

const Notifications = dynamic(() => import("../components/Notifications"), {
  loading: () => <Loader />,
});

export default function Page() {
  return <Notifications />;
}
