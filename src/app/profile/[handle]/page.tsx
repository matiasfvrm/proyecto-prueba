import type { Metadata } from "next";
import { seedCatalog } from "@/lib/data/seed";
import { Profile } from "@/components/account/profile";

type Props = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const u = seedCatalog.users.find((x) => x.handle === handle);
  return { title: u ? `${u.name} (demo profile)` : "Contributor profile", robots: { index: false } };
}

export default async function ProfilePage({ params }: Props) {
  const { handle } = await params;
  return <Profile handle={handle} />;
}
