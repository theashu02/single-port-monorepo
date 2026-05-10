import dynamic from "next/dynamic";
import Loader from "@/components/ui/Loader";

const FriendList = dynamic(() => import("../components/FriendList"), {
  loading: () => <Loader />,
});

export default function Page() {
  return <FriendList />;
}
