import type { Metadata } from "next"

import { DelegatesView } from "@/components/demo/delegates-view"
import { isLocale } from "@/i18n/config"
import { getDictionary } from "@/i18n"
import { pageMetadata } from "@/lib/metadata"

export async function generateMetadata({ params }: PageProps<"/[locale]/app/delegates">): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const m = getDictionary(locale).meta.pages.delegates
  return pageMetadata(locale, "/app/delegates", m.title, m.description)
}

export default function Page() {
  return <DelegatesView />
}
