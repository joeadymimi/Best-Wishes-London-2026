import { AppClient } from "@/components/app-client";

type MatchPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MatchPage({ params }: MatchPageProps) {
  const { id } = await params;

  return <AppClient mode="detail" initialMatchId={id} />;
}
