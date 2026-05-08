import dynamic from "next/dynamic";
import Loader from "@/components/ui/Loader";

const OnlinePeoplePage = dynamic(() => import("../components/online-people/OnlinePeoplePage"), {
  loading: () => <Loader />,
});

export default function Page() {
  return <OnlinePeoplePage />;
}
