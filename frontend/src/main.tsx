import "./style.css"
import { useEffect, useState } from "react"
import { createRoot } from "react-dom/client"
import { BookOpen, Camera, Search, Sparkles } from "lucide-react"
import { Navbar } from "./components/Navbar"
import type { View } from "./components/Navbar"
import { ScannerView } from "./components/ScannerView"
import { SpecimenResultModal } from "./components/SpecimenResultModal"
import type { SpecimenResult } from "./components/SpecimenResultModal"

type Specimen = SpecimenResult
const API_BASE = `${(import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "")}/api/v1`

const normalizeSpecimen = (item: Record<string, unknown>, index: number): Specimen => ({
  id: String(item.id ?? index),
  species_name: String(item.species_name ?? "Uncatalogued specimen"),
  scientific_name: String(item.scientific_name ?? "Species pending review"),
  category: (item.category as Specimen["category"]) ?? "Flora",
  rarity: (item.rarity as Specimen["rarity"]) ?? "Common",
  toxicity_warning: String(item.toxicity_warning ?? "Handle with care until identified."),
  fun_fact: String(item.fun_fact ?? "Every observation adds to our understanding of the living world."),
  xp_reward: Number(item.xp_reward ?? 25),
  location: item.latitude && item.longitude ? `${item.latitude}, ${item.longitude}` : "Observation",
  image_url: typeof item.image_url === "string" ? item.image_url : "",
  captured_at: String(item.captured_at ?? item.created_at ?? "Just now"),
})

const App = () => {
  const [activeView, setActiveView] = useState<View>("scanner")
  const [showModal, setShowModal] = useState(false)
  const [specimen, setSpecimen] = useState<Specimen | null>(null)
  const [payloads, setPayloads] = useState<Specimen[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState("")
  const [scanPersisted, setScanPersisted] = useState(false)
  const [query, setQuery] = useState("")

  useEffect(() => { void fetchPayloads() }, [])

  const fetchPayloads = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`${API_BASE}/payloads?count=50`)
      if (!res.ok) throw new Error("Collection unavailable")
      const data: unknown = await res.json()
      setPayloads(Array.isArray(data) ? data.map((item, index) => normalizeSpecimen(item, index)) : [])
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "unknown network error"
      setError(`The collection could not be reached (${message}).`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleScan = async (file: File) => {
    setError("")
    setIsScanning(true)
    const formData = new FormData()
    formData.append("image", file)
    const localImageUrl = URL.createObjectURL(file)
    try {
      const res = await fetch(`${API_BASE}/analyse-image`, { method: "POST", body: formData })
      const data: unknown = await res.json().catch(() => null)
      if (!res.ok) {
        const detail = typeof data === "object" && data !== null && "detail" in data ? data.detail : null
        const blocked = typeof detail === "object" && detail !== null && "code" in detail && detail.code === "CONTENT_BLOCKED"

        if (res.status === 422 && blocked) {
          const message = "message" in detail && typeof detail.message === "string"
            ? detail.message
            : "This image cannot be processed as a nature observation."
          URL.revokeObjectURL(localImageUrl)
          setSpecimen(null)
          setScanPersisted(false)
          setError(message)
          return
        }

        throw new Error(`Analysis unavailable (${res.status})`)
      }

      const result = normalizeSpecimen(data as Record<string, unknown>, Date.now())
      setScanPersisted(true)
      setSpecimen(result)
      setPayloads((current) => [result, ...current.filter((item) => item.id !== result.id)])
      setShowModal(true)
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "unknown network error"
      const result: Specimen = {
        id: String(Date.now()), species_name: "Uncatalogued specimen", scientific_name: "Identification unavailable",
        category: "Flora", rarity: "Common", toxicity_warning: "Treat as unidentified until reviewed.",
        fun_fact: "Your observation is ready to revisit when the archive is online.", xp_reward: 0,
        location: "This session", image_url: localImageUrl, captured_at: "Just now",
      }
      setScanPersisted(false)
      setSpecimen(result)
      setPayloads((current) => [result, ...current])
      setError(`Local scan mode is active (${message}). Start the API to identify and save this observation.`)
    } finally {
      setIsScanning(false)
    }
  }

  const filteredPayloads = payloads.filter((item) => `${item.species_name} ${item.scientific_name} ${item.category}`.toLowerCase().includes(query.toLowerCase()))

  const renderCards = (items: Specimen[]) => <div className="specimen-grid">
    {items.map((item) => <article className="specimen-card" key={item.id}>
      <div className="card-image">{item.image_url ? <img src={item.image_url} alt={item.species_name} /> : <div className="image-placeholder"><Camera size={24} /><span>Image not stored</span></div>}<span className={`rarity rarity-${item.rarity.toLowerCase()}`}>{item.rarity}</span></div>
      <div className="card-copy"><div className="card-category">{item.category} <span>·</span> {item.location}</div><h3>{item.species_name}</h3><p>{item.scientific_name}</p><div className="card-footer"><span><Sparkles size={14} /> {item.xp_reward} XP</span><span>{item.captured_at}</span></div></div>
    </article>)}
  </div>

  const renderCollection = () => <main className="page archive-page">
    <div className="eyebrow"><BookOpen size={15} /> COLLECTION / {payloads.length.toString().padStart(2, "0")} OBSERVATIONS</div>
    <div className="page-heading"><div><h1>Your observations.</h1><p>What you have seen, identified, and kept close.</p></div><div className="stat-block"><strong>{payloads.reduce((sum, item) => sum + item.xp_reward, 0)}</strong><span>field points</span></div></div>
    <div className="search-field"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your collection" aria-label="Search your collection" /></div>
    {isLoading ? <div className="empty-state">Opening your collection...</div> : filteredPayloads.length ? renderCards(filteredPayloads) : <div className="empty-state">No observations yet. Scan something alive to begin.</div>}
  </main>

  const renderView = () => activeView === "collection" ? renderCollection() : <ScannerView onScan={handleScan} isScanning={isScanning} error={error} />

  return <div className="app-shell">
    <header className="topbar"><div className="mobile-brand"><span className="brand-seed">z</span> zoidex</div><div className="topbar-status"><span className="status-dot" /> outdoors <span className="status-divider" /> 2026</div></header>
    {renderView()}
    <Navbar activeView={activeView} onChange={setActiveView} />
    {specimen && <SpecimenResultModal isOpen={showModal} specimen={specimen} persisted={scanPersisted} onClose={() => setShowModal(false)} />}
  </div>
}

createRoot(document.getElementById("app")!).render(<App />)
