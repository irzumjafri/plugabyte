import HomeClient from '@/components/Home/HomeClient';
import { BUILD_TYPES, type BuildTypeId } from '@/lib/estimator';

const VALID_IDS = new Set(BUILD_TYPES.map(b => b.id));

interface Props {
  searchParams: Promise<{ type?: string }>;
}

export default async function Home({ searchParams }: Props) {
  const { type } = await searchParams;
  const initialType = type && VALID_IDS.has(type as BuildTypeId) ? (type as BuildTypeId) : null;

  return <HomeClient initialType={initialType} />;
}
