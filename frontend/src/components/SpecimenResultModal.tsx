import { Camera, MapPin, ShieldCheck, Sparkles, X } from "lucide-react"

export interface SpecimenResult {
  id: string
  species_name: string
  scientific_name: string
  category: "Flora" | "Fauna" | "Fungi"
  rarity: "Common" | "Rare" | "Legendary"
  toxicity_warning: string
  fun_fact: string
  xp_reward: number
  location: string
  image_url: string
  captured_at: string
}

export const SpecimenResultModal = ({ isOpen, specimen, onClose, persisted }: {
  isOpen: boolean
  specimen: SpecimenResult
  onClose: () => void
  persisted: boolean
}) => {
  if (!isOpen) return null

  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Specimen result">
    <div className="result-modal">
      <button className="icon-button modal-close" onClick={onClose} aria-label="Close result"><X size={19} /></button>
      <div className="result-image">{specimen.image_url ? <img src={specimen.image_url} alt={specimen.species_name} /> : <div className="image-placeholder"><Camera size={28} /><span>Image not stored yet</span></div>}</div>
      <div className="result-copy">
        <div className="eyebrow">IDENTIFIED / {specimen.category}</div>
        <h2>{specimen.species_name}</h2>
        <p className="scientific">{specimen.scientific_name}</p>
        <div className="result-meta"><span className={`rarity rarity-${specimen.rarity.toLowerCase()}`}>{specimen.rarity}</span><span><Sparkles size={15} /> +{specimen.xp_reward} XP</span></div>
        <div className="fact-row"><ShieldCheck size={18} /><span>{specimen.toxicity_warning}</span></div>
        <blockquote>“{specimen.fun_fact}”</blockquote>
        <div className="capture-line"><MapPin size={15} /> {specimen.location} · {specimen.captured_at}</div>
        <p className="save-status">{persisted ? "Already saved to your collection." : "Available in this session. Start the API to save it permanently."}</p>
        <button className="button button-primary full-width" onClick={onClose}>Done</button>
      </div>
    </div>
  </div>
}
