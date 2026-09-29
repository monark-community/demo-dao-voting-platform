import type { Metadata } from "next"

import { ResultsView } from "@/components/demo/results-view"
import { isLocale } from "@/i18n/config"
import { getDictionary } from "@/i18n"
import { pageMetadata } from "@/lib/metadata"

export async function generateMetadata({ params }: PageProps<"/[locale]/app/results">): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const m = getDictionary(locale).meta.pages.results
  return pageMetadata(locale, "/app/results", m.title, m.description)
}

export default function Page() {
  return <ResultsView />
}
