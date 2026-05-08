import dynamic from "next/dynamic";
import Loader from "@/components/ui/Loader";

const OnlinePeoplePage = dynamic(() => import("../components/OnlinePeoplePage"), {
  loading: () => <Loader />,
});

export default function Page() {
  return <OnlinePeoplePage />;
}
