// Visual check of every page and key flow with Playwright.
// Usage: pnpm build && pnpm start -p 3138   (in another terminal)
//        pnpm screenshots                    (BASE_URL defaults to http://localhost:3138)
// Output: docs/screenshots/<locale>-<width>-<theme>-<name>.png
import { mkdir, readdir, rm } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright"

const BASE = process.env.BASE_URL ?? "http://localhost:3138"
const OUT = fileURLToPath(new URL("../docs/screenshots/", import.meta.url))
const ONLY = process.env.ONLY // optional filter on the variant name
const KEY = "govchain-demo-v1"

const widths = { 390: { width: 390, height: 844 }, 1440: { width: 1440, height: 900 } }
const variants = []
for (const w of [390, 1440]) for (const theme of ["light", "dark"]) variants.push({ locale: "en", w, theme })
// French: home page and one key flow, both widths, light.
for (const w of [390, 1440]) variants.push({ locale: "fr", w, theme: "light" })

const L = {
  en: { connect: "Connect demo wallet", confirm: "Confirm", reject: "Reject", for: "For", cast: "Cast your vote", voted: "You voted", menu: "Open menu" },
  fr: { connect: "Connecter le portefeuille de démo", confirm: "Confirmer", reject: "Refuser", for: "Pour", cast: "Voter", voted: "Votre vote", menu: "Ouvrir le menu" },
}

async function newPage(browser, { locale, w, theme }) {
  const context = await browser.newContext({
    viewport: widths[w],
    colorScheme: theme,
    locale: locale === "fr" ? "fr-CA" : "en-CA",
    reducedMotion: "no-preference",
  })
  await context.addInitScript((t) => {
    try {
      window.localStorage.setItem("theme", t)
    } catch {}
  }, theme)
  const page = await context.newPage()
  return { context, page }
}

/** Scroll through the page so lazy images load, then back to the top. */
async function settle(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 40))
    }
    window.scrollTo(0, 0)
  })
  await page.waitForTimeout(300)
}

const shot = async (page, v, name, fullPage = false) => {
  const file = `${OUT}${v.locale}-${v.w}-${v.theme}-${name}.png`
  if (fullPage) await settle(page)
  await page.waitForTimeout(250)
  await page.screenshot({ path: file, fullPage })
  console.log("  ✓", `${v.locale}-${v.w}-${v.theme}-${name}`)
}

async function patch(page, fn, arg) {
  await page.evaluate(
    ([key, src, a]) => {
      const s = JSON.parse(localStorage.getItem(key))
      new Function("s", "a", src)(s, a)
      localStorage.setItem(key, JSON.stringify(s))
    },
    [KEY, fn, arg]
  )
}

async function connect(page, v, capture) {
  const l = L[v.locale]
  await page.goto(`${BASE}/${v.locale}/app`, { waitUntil: "networkidle" })
  const btn = page.getByRole("main").getByRole("button", { name: l.connect })
  await btn.waitFor()
  // Keep screenshots deterministic: no simulated live voters.
  await patch(page, "s.settings.liveVoters = false")
  await page.reload({ waitUntil: "networkidle" })
  await btn.waitFor()
  if (capture) await shot(page, v, "flow1-gate", true)
  await btn.click()
  const dialog = page.getByRole("dialog")
  await dialog.waitFor()
  if (capture) await shot(page, v, "flow1-connect-prompt")
  await dialog.getByRole("button", { name: l.confirm }).click()
  await page.getByRole("heading", { level: 1, name: "Riverbend Blockchain Society" }).waitFor({ timeout: 10000 })
}

async function confirmPrompt(page, v) {
  const dialog = page.getByRole("dialog")
  await dialog.waitFor()
  await dialog.getByRole("button", { name: L[v.locale].confirm }).click()
}

async function marketing(page, v) {
  for (const [name, path] of [
    ["home", ""],
    ["how-it-works", "/how-it-works"],
    ["credits", "/credits"],
    ["pricing", "/pricing"],
    ["404", "/this-page-does-not-exist"],
  ]) {
    await page.goto(`${BASE}/${v.locale}${path}`, { waitUntil: "networkidle" })
    await page.waitForTimeout(400)
    await shot(page, v, `page-${name}`, true)
  }
  if (v.w < 768) {
    await page.goto(`${BASE}/${v.locale}`, { waitUntil: "networkidle" })
    await page.getByRole("button", { name: L[v.locale].menu }).click()
    await page.getByRole("dialog").waitFor()
    await shot(page, v, "page-mobile-menu")
  }
}

async function appFlows(page, v) {
  // Flow 1: connect (gate + prompt captured inside connect()), then the rejected variant
  await connect(page, v, true)
  await shot(page, v, "app-01-proposals", true)
  await patch(page, "s.wallet.status = 'disconnected'")
  await page.reload({ waitUntil: "networkidle" })
  await page.getByRole("main").getByRole("button", { name: "Connect demo wallet" }).click()
  await page.getByRole("dialog").getByRole("button", { name: "Reject" }).click()
  await page.getByText("You declined the sign-in request").waitFor()
  await shot(page, v, "flow1-connect-rejected")
  await page.getByRole("main").getByRole("button", { name: "Connect demo wallet" }).click()
  await confirmPrompt(page, v)
  await page.getByRole("heading", { level: 1, name: "Riverbend Blockchain Society" }).waitFor({ timeout: 10000 })

  // Flow 3: delegate to Amara, see the vote panel explain it, then take the power back
  await page.goto(`${BASE}/${v.locale}/app/delegates`, { waitUntil: "networkidle" })
  await page.getByRole("heading", { level: 1 }).waitFor()
  await shot(page, v, "flow3-delegates", true)
  await page.getByRole("button", { name: /^Delegate 1,250 tGOV/ }).filter({ visible: true }).first().click()
  await page.getByRole("dialog").waitFor()
  await shot(page, v, "flow3-delegate-prompt")
  await confirmPrompt(page, v)
  await page.getByText("Updating your delegation…").filter({ visible: true }).first().waitFor()
  await shot(page, v, "flow3-delegate-pending")
  await page.getByText("Delegated to Amara Diallo").filter({ visible: true }).first().waitFor({ timeout: 10000 })
  await page.waitForTimeout(900)
  await shot(page, v, "flow3-delegated", true)
  await page.goto(`${BASE}/${v.locale}/app/proposals/winter-hackathon-prize-pool`, { waitUntil: "networkidle" })
  await page.getByText("You delegated your power to Amara Diallo").waitFor()
  await page.getByRole("heading", { name: "Your vote" }).scrollIntoViewIfNeeded()
  await shot(page, v, "flow3-vote-delegated-away")
  await page.goto(`${BASE}/${v.locale}/app/delegates`, { waitUntil: "networkidle" })
  await page.getByRole("button", { name: "Take back my power" }).click()
  await confirmPrompt(page, v)
  await page.getByText("You vote for yourself").waitFor({ timeout: 10000 })

  // Flow 2: vote on the hackathon proposal; your ballot tips it over quorum
  await page.goto(`${BASE}/${v.locale}/app/proposals/winter-hackathon-prize-pool`, { waitUntil: "networkidle" })
  await page.getByRole("heading", { level: 1 }).waitFor()
  await shot(page, v, "flow2-proposal", true)
  await page.getByRole("radio", { name: "For", exact: true }).check({ force: true })
  await page.getByLabel("Add a reason (optional)").fill("Sponsors double it, and last year's builders are still shipping.")
  await page.getByRole("button", { name: "Cast your vote" }).click()
  await page.getByRole("dialog").waitFor()
  await shot(page, v, "flow2-vote-prompt")
  await confirmPrompt(page, v)
  await page.getByText("Recording your vote…").filter({ visible: true }).first().waitFor()
  await page.evaluate(() => window.scrollTo(0, 0))
  await shot(page, v, "flow2-vote-pending")
  await page.getByText("Ballots are final.").waitFor({ timeout: 10000 })
  await page.waitForTimeout(900)
  await page.evaluate(() => window.scrollTo(0, 0))
  await shot(page, v, "flow2-voted")
  // Failed vote on the code-of-conduct proposal
  await patch(page, "s.settings.failNext = true")
  await page.goto(`${BASE}/${v.locale}/app/proposals/code-of-conduct-for-calls`, { waitUntil: "networkidle" })
  await page.getByRole("button", { name: "Cast your vote" }).click()
  await page.getByText("Choose For, Against or Abstain first.").waitFor()
  await page.getByRole("radio", { name: "Against", exact: true }).check({ force: true })
  await page.getByRole("button", { name: "Cast your vote" }).click()
  await confirmPrompt(page, v)
  await page.getByText("The transaction failed on the network").waitFor({ timeout: 10000 })
  await page.getByText("The transaction failed on the network").scrollIntoViewIfNeeded()
  await shot(page, v, "flow2-vote-failed")

  // Flow 4: publish a proposal with a treasury action (errors, a failed attempt, then success)
  await page.goto(`${BASE}/${v.locale}/app/new`, { waitUntil: "networkidle" })
  await page.getByRole("heading", { level: 1 }).waitFor()
  await shot(page, v, "flow4-composer-blank", true)
  await page.getByRole("button", { name: "Publish proposal" }).click()
  await page.getByText("Fix these before publishing:").waitFor()
  await shot(page, v, "flow4-composer-errors", true)
  await page.getByRole("button", { name: "Fund a workshop series" }).click()
  await shot(page, v, "flow4-composer-filled", true)
  await patch(page, "s.settings.failNext = true")
  await page.reload({ waitUntil: "networkidle" })
  await page.getByRole("button", { name: "Fund a workshop series" }).click()
  await page.getByRole("button", { name: "Publish proposal" }).click()
  await confirmPrompt(page, v)
  await page.getByText("Publishing your proposal…").filter({ visible: true }).first().waitFor()
  await shot(page, v, "flow4-publish-pending")
  await page.getByText("The transaction failed on the network").filter({ visible: true }).first().waitFor({ timeout: 10000 })
  await page.getByText("The transaction failed on the network").filter({ visible: true }).first().scrollIntoViewIfNeeded()
  await shot(page, v, "flow4-publish-failed")
  await page.getByRole("button", { name: "Try again" }).filter({ visible: true }).first().click()
  await confirmPrompt(page, v)
  await page.waitForURL(/\/app\/proposals\/fund-a-spring-workshop-series/, { timeout: 15000 })
  await page.getByRole("heading", { level: 1, name: "Fund a spring workshop series" }).waitFor()
  await shot(page, v, "flow4-published", true)

  // Flow 5: close the vote early, then execute a passed proposal
  await page.getByRole("button", { name: "End voting now" }).click()
  await page.getByText("Voting closed", { exact: false }).filter({ visible: true }).first().waitFor()
  await page.evaluate(() => window.scrollTo(0, 0))
  await shot(page, v, "flow5-closed-early")
  await page.goto(`${BASE}/${v.locale}/app/proposals/food-coop-payments-pilot`, { waitUntil: "networkidle" })
  await page.getByRole("heading", { level: 1 }).waitFor()
  await shot(page, v, "flow5-passed", true)
  await page.getByRole("button", { name: "Execute", exact: true }).click()
  await page.getByRole("dialog").waitFor()
  await shot(page, v, "flow5-execute-prompt")
  await confirmPrompt(page, v)
  await page.getByText("Waiting for the network…").filter({ visible: true }).first().waitFor()
  await page.getByRole("heading", { name: "Execute the decision" }).scrollIntoViewIfNeeded()
  await shot(page, v, "flow5-execute-pending")
  await page.getByText("Passed and executed.").waitFor({ timeout: 10000 })
  await page.waitForTimeout(600)
  await page.evaluate(() => window.scrollTo(0, 0))
  await shot(page, v, "flow5-executed", true)

  // Results and history
  await page.goto(`${BASE}/${v.locale}/app/results`, { waitUntil: "networkidle" })
  await page.getByRole("heading", { level: 1 }).waitFor()
  await shot(page, v, "app-02-results", true)

  // Roles: a voter can't publish
  await patch(page, "s.members.forEach((m) => { if (m.address === s.wallet.address) m.role = 'voter' })")
  await page.goto(`${BASE}/${v.locale}/app/new`, { waitUntil: "networkidle" })
  await page.getByRole("heading", { name: "Publishing needs the proposer role" }).waitFor()
  await shot(page, v, "flow4-composer-locked")

  // Demo controls
  await page.getByRole("button", { name: "Demo controls" }).click()
  await page.getByRole("dialog").waitFor()
  await shot(page, v, "app-03-demo-controls")
  await page.keyboard.press("Escape")
}

async function frenchFlow(page, v) {
  const l = L.fr
  await page.goto(`${BASE}/fr`, { waitUntil: "networkidle" })
  await page.waitForTimeout(400)
  await shot(page, v, "page-home", true)
  await connect(page, v, true)
  await shot(page, v, "app-01-proposals", true)
  await page.goto(`${BASE}/fr/app/proposals/winter-hackathon-prize-pool`, { waitUntil: "networkidle" })
  await page.getByRole("heading", { level: 1 }).waitFor()
  await page.getByRole("radio", { name: l.for, exact: true }).check({ force: true })
  await page.getByRole("button", { name: l.cast, exact: true }).click()
  await page.getByRole("dialog").waitFor()
  await shot(page, v, "flow2-vote-prompt")
  await confirmPrompt(page, v)
  await page.getByText("Les bulletins sont définitifs.").waitFor({ timeout: 10000 })
  await page.waitForTimeout(900)
  await page.evaluate(() => window.scrollTo(0, 0))
  await shot(page, v, "flow2-voted", true)
  await page.goto(`${BASE}/fr/app/new`, { waitUntil: "networkidle" })
  await page.getByRole("button", { name: "Financer une série d'ateliers" }).click()
  await shot(page, v, "flow4-composer-filled", true)
}

const browser = await chromium.launch()
await mkdir(OUT, { recursive: true })
if (!ONLY) for (const f of await readdir(OUT)) if (f.endsWith(".png")) await rm(`${OUT}${f}`)
for (const v of variants) {
  const tag = `${v.locale}-${v.w}-${v.theme}`
  if (ONLY && !tag.includes(ONLY)) continue
  console.log(tag)
  const { context, page } = await newPage(browser, v)
  try {
    if (v.locale === "fr") await frenchFlow(page, v)
    else {
      await marketing(page, v)
      await appFlows(page, v)
    }
  } catch (e) {
    console.error("  ✗", tag, e.message)
    await page.screenshot({ path: `${OUT}_error-${tag}.png` }).catch(() => {})
    process.exitCode = 1
  }
  await context.close()
}
await browser.close()
