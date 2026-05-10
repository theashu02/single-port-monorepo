import dynamic from "next/dynamic";
import Loader from "@/components/ui/Loader";

const Settings = dynamic(() => import("../components/Settings"), {
  loading: () => <Loader />,
});

export default function Page() {
  return <Settings />;
}
