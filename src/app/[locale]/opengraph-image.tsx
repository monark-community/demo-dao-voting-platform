import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { ImageResponse } from "next/og"

import { isLocale, locales } from "@/i18n/config"
import { getDictionary } from "@/i18n"

export const alt = "GovChain by Monark"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function OpenGraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale = isLocale(raw) ? raw : "en"
  const d = getDictionary(locale)
  const mark = await readFile(join(process.cwd(), "public/brand/monark-mark.svg"), "utf8")
  const markSrc = `data:image/svg+xml;base64,${Buffer.from(mark).toString("base64")}`

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#FFF9F3", color: "#15110E", padding: 72 }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 600 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={markSrc} width={64} height={64} alt="" />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 44, fontWeight: 800, lineHeight: 1 }}>GovChain</span>
              <span style={{ fontSize: 22, color: "#625952", marginTop: 6 }}>{d.common.byMonark}</span>
            </div>
          </div>
          <div style={{ fontSize: 58, fontWeight: 800, lineHeight: 1.08, letterSpacing: -1.5 }}>{d.meta.ogTagline}</div>
          <div style={{ fontSize: 22, color: "#625952" }}>{d.common.demoBadge}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", marginLeft: 48, width: 420, gap: 28 }}>
          <div style={{ display: "flex", flexDirection: "column", background: "#FFFEFC", border: "2px solid #E9DFD7", borderRadius: 32, padding: 32, gap: 20 }}>
            <span style={{ fontSize: 26, fontWeight: 800 }}>{d.home.hero.title}</span>
            <div style={{ display: "flex", position: "relative", height: 28 }}>
              <div style={{ display: "flex", width: "100%", height: 28, borderRadius: 14, overflow: "hidden", background: "#F7ECE4" }}>
                <div style={{ width: "69%", background: "#F88D10" }} />
                <div style={{ width: "31%", background: "#4A4541" }} />
              </div>
              <div style={{ position: "absolute", left: "50%", top: -8, width: 4, height: 44, borderRadius: 2, background: "#15110E" }} />
            </div>
            <div style={{ display: "flex", position: "relative", height: 12 }}>
              <div style={{ display: "flex", width: "100%", height: 12, borderRadius: 6, overflow: "hidden", background: "#F7ECE4" }}>
                <div style={{ width: "41%", background: "#15110E" }} />
              </div>
              <div style={{ position: "absolute", left: "20%", top: -6, width: 4, height: 24, borderRadius: 2, background: "#2F7A4A" }} />
            </div>
            <span style={{ display: "flex", alignSelf: "flex-start", fontSize: 22, fontWeight: 800, color: "#2F7A4A", border: "2px solid #2F7A4A", borderRadius: 999, padding: "6px 16px" }}>
              {d.terms.quorumReached} · {d.terms.live.passing}
            </span>
          </div>
        </div>
      </div>
    ),
    size
  )
}
