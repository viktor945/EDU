import { notFound } from "next/navigation";
import { sectionSlugs, type SectionSlug } from "./section-config";
import SectionExperience from "./managed-experience";

export function generateStaticParams() {
  return sectionSlugs.map((slug) => ({ slug }));
}

export default async function SectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!sectionSlugs.includes(slug as SectionSlug)) {
    notFound();
  }

  return <SectionExperience slug={slug as SectionSlug} />;
}
