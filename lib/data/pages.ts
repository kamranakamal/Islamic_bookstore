import { cache } from "react";

import { getServerSupabaseClient } from "@/lib/authHelpers";
import type { PageSection, PageSectionRow, SitePage, SitePageRow } from "@/lib/types";

function mapSection(row: PageSectionRow): PageSection {
  return {
    id: row.id,
    identifier: row.identifier,
    type: row.type,
    heading: row.heading ?? undefined,
    body: row.body ?? undefined,
    position: row.position,
    metadata: row.metadata
  } satisfies PageSection;
}

function mapPage(row: SitePageRow, sections: PageSectionRow[]): SitePage {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    heroEyebrow: row.hero_eyebrow ?? undefined,
    heroTitle: row.hero_title ?? undefined,
    heroDescription: row.hero_description ?? undefined,
    body: row.body,
    metadata: row.metadata,
    published: row.published,
    sections: sections.map(mapSection)
  } satisfies SitePage;
}

export const getSitePage = cache(async (slug: string): Promise<SitePage | null> => {
  const supabase = getServerSupabaseClient();

  const { data: pageRow } = await supabase
    .from("site_pages")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  const typedPage = pageRow as SitePageRow | null;

  if (!typedPage) {
    return null;
  }

  const { data: sectionRows } = await supabase
    .from("page_sections")
    .select("*")
    .eq("page_id", typedPage.id)
    .order("position", { ascending: true });

  return mapPage(typedPage, (sectionRows ?? []) as PageSectionRow[]);
});
