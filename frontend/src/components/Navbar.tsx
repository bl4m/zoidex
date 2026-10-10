import { BookOpen, Camera, type LucideIcon } from "lucide-react"

export type View = "scanner" | "collection"

export const Navbar = ({ activeView, onChange }: { activeView: View; onChange: (view: View) => void }) => {
  const tabs: { id: View; label: string; icon: LucideIcon }[] = [
    { id: "scanner", label: "Scan", icon: Camera },
    { id: "collection", label: "Collection", icon: BookOpen },
  ]

  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      <div className="nav-inner">
        <div className="brand-mark" aria-label="Zoidex home">
          <span className="brand-seed">z</span>
          <span>zoidex</span>
        </div>
        <div className="nav-tabs">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" className={`nav-tab ${activeView === id ? "active" : ""}`} onClick={() => onChange(id)} aria-current={activeView === id ? "page" : undefined}>
              <Icon size={17} strokeWidth={1.8} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}