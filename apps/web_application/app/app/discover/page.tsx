import dynamic from 'next/dynamic';
import Loader from '@/components/ui/Loader';

const DiscoverPage = dynamic(() => import('../components/DiscoverPage'), {
  loading: () => <Loader />,
});

export default function Page() {
  return <DiscoverPage />;
}
