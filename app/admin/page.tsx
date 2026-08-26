"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Shield, LogOut, Plus, Trash2, ChevronDown, ChevronUp,
  Eye, EyeOff, Package, ImageIcon, X, Loader2,
  Upload, Sparkles, Check, AlertCircle, RefreshCw, Link
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface MemePack {
  id: string
  name: string
  memes: string[]
  is_default: boolean
  created_at: string
}

// ─── API helpers (all requests carry the admin token) ─────────────────────────

function adminFetch(url: string, options: RequestInit = {}) {
  const token = sessionStorage.getItem("admin_token") ?? ""
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": token,
      ...(options.headers ?? {}),
    },
  })
}

// ─── Login Screen ─────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (data.ok) {
        sessionStorage.setItem("admin_token", password)
        onLogin()
      } else {
        setError(data.error ?? "Mot de passe incorrect")
      }
    } catch {
      setError("Erreur réseau")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/15 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 w-full max-w-sm animate-in fade-in slide-in-from-bottom-6 duration-700">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 border-2 border-primary/40 mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Farwane Admin
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Espace réservé à l&apos;administrateur</p>
        </div>

        {/* Form */}
        <div className="bg-card/60 backdrop-blur-sm border-2 border-border/50 rounded-2xl p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError("") }}
                  placeholder="••••••••••••"
                  className="w-full h-11 px-4 pr-11 rounded-xl bg-muted/50 border-2 border-border focus:border-primary outline-none transition-colors text-sm"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!password || loading}
              className="w-full h-11 rounded-xl font-bold text-sm bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg shadow-primary/30"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              {loading ? "Vérification..." : "Accéder au panel"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

// ─── Create Pack Modal ────────────────────────────────────────────────────────

function CreatePackModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("")
  const [urlsText, setUrlsText] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const memes = urlsText.split("\n").map((u) => u.trim()).filter(Boolean)
    if (!name.trim()) { setError("Nom obligatoire"); return }
    if (memes.length < 3) { setError("Minimum 3 URLs"); return }

    setLoading(true)
    setError("")
    try {
      const res = await adminFetch("/api/admin/packs", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), memes }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Erreur"); return }
      onCreated()
      onClose()
    } catch {
      setError("Erreur réseau")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card border-2 border-border/60 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-300 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Nouveau pack
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Nom du pack</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Pack Été 2026..."
              className="w-full h-10 px-3 rounded-xl bg-muted/50 border-2 border-border focus:border-primary outline-none transition-colors text-sm"
              autoFocus
              maxLength={60}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Link className="w-3.5 h-3.5" />
              URLs des mèmes <span className="text-xs opacity-60">(une par ligne, min. 3)</span>
            </label>
            <textarea
              value={urlsText}
              onChange={(e) => setUrlsText(e.target.value)}
              placeholder={"https://media.giphy.com/...\nhttps://media.tenor.com/...\nhttps://..."}
              rows={8}
              className="w-full px-3 py-2.5 rounded-xl bg-muted/50 border-2 border-border focus:border-primary outline-none transition-colors text-sm font-mono resize-none leading-relaxed"
            />
            <p className="text-xs text-muted-foreground">
              {urlsText.split("\n").map((u) => u.trim()).filter(Boolean).length} URL(s) détectée(s)
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-xl border-2 border-border hover:bg-muted/50 transition-colors text-sm font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-10 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold text-sm hover:from-primary/90 hover:to-primary/70 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {loading ? "Création..." : "Créer le pack"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Meme Thumbnail (with broken-URL detection) ───────────────────────────────

function MemeThumb({
  meme, index, isRemoving, onRemove,
}: { meme: string; index: number; isRemoving: boolean; onRemove: () => void }) {
  const [broken, setBroken] = useState(false)
  const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(meme)

  return (
    <div className={`relative group aspect-square rounded-lg overflow-hidden bg-muted/40 border ${broken ? "border-destructive/60" : "border-border/40"}`}>
      {isVideo ? (
        <video
          src={meme}
          className="w-full h-full object-cover"
          muted
          loop
          autoPlay
          playsInline
          onError={() => setBroken(true)}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={meme}
          alt={`Mème ${index + 1}`}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setBroken(true)}
        />
      )}

      {/* Broken overlay */}
      {broken && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/20 border-2 border-destructive/50">
          <span className="text-lg">❌</span>
          <span className="text-[8px] font-bold text-destructive text-center leading-tight px-1">URL cassée</span>
        </div>
      )}

      {/* Index badge */}
      <span className={`absolute top-0.5 left-0.5 text-[9px] font-bold rounded px-1 leading-4 ${broken ? "bg-destructive/80 text-white" : "bg-background/80"}`}>
        {index + 1}
      </span>

      {/* Remove button on hover */}
      <button
        onClick={onRemove}
        disabled={isRemoving}
        className="absolute inset-0 flex items-center justify-center bg-background/70 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {isRemoving
          ? <Loader2 className="w-5 h-5 animate-spin text-destructive" />
          : <X className="w-5 h-5 text-destructive" />
        }
      </button>
    </div>
  )
}

// ─── Pack Card ────────────────────────────────────────────────────────────────

function PackCard({ pack, onUpdated, onDeleted }: { pack: MemePack; onUpdated: () => void; onDeleted: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [addUrlsText, setAddUrlsText] = useState("")
  const [addLoading, setAddLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [removingIndex, setRemovingIndex] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; msg: string } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const showFeedback = (type: "ok" | "err", msg: string) => {
    setFeedback({ type, msg })
    setTimeout(() => setFeedback(null), 3000)
  }

  const handleAddMemes = async (e: React.FormEvent) => {
    e.preventDefault()
    const memes = addUrlsText.split("\n").map((u) => u.trim()).filter(Boolean)
    if (memes.length === 0) return
    setAddLoading(true)
    try {
      const res = await adminFetch(`/api/admin/packs/${pack.id}/memes`, {
        method: "POST",
        body: JSON.stringify({ memes }),
      })
      if (res.ok) {
        setAddUrlsText("")
        showFeedback("ok", `${memes.length} mème(s) ajouté(s) !`)
        onUpdated()
      } else {
        const d = await res.json()
        showFeedback("err", d.error ?? "Erreur")
      }
    } catch {
      showFeedback("err", "Erreur réseau")
    } finally {
      setAddLoading(false)
    }
  }

  const handleRemoveMeme = async (index: number) => {
    setRemovingIndex(index)
    try {
      const res = await adminFetch(`/api/admin/packs/${pack.id}/memes?index=${index}`, { method: "DELETE" })
      if (res.ok) { showFeedback("ok", "Mème supprimé"); onUpdated() }
      else { const d = await res.json(); showFeedback("err", d.error ?? "Erreur") }
    } catch {
      showFeedback("err", "Erreur réseau")
    } finally {
      setRemovingIndex(null)
    }
  }

  const handleDeletePack = async () => {
    setDeleteLoading(true)
    try {
      const res = await adminFetch(`/api/admin/packs?id=${pack.id}`, { method: "DELETE" })
      if (res.ok) onDeleted()
      else { const d = await res.json(); showFeedback("err", d.error ?? "Erreur") }
    } catch {
      showFeedback("err", "Erreur réseau")
    } finally {
      setDeleteLoading(false)
      setConfirmDelete(false)
    }
  }

  return (
    <div className="bg-card/50 backdrop-blur-sm border-2 border-border/50 rounded-2xl overflow-hidden transition-all duration-300 hover:border-border">
      {/* Pack Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-3 flex-1 text-left group"
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 shrink-0">
            <Package className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-bold group-hover:text-primary transition-colors">{pack.name}</p>
            <p className="text-xs text-muted-foreground">
              {pack.memes.length} mème{pack.memes.length !== 1 ? "s" : ""}
              {" · "}
              {new Date(pack.created_at).toLocaleDateString("fr-FR")}
            </p>
          </div>
          {expanded
            ? <ChevronUp className="w-4 h-4 text-muted-foreground ml-2" />
            : <ChevronDown className="w-4 h-4 text-muted-foreground ml-2" />
          }
        </button>

        {/* Delete Pack */}
        <div className="flex items-center gap-2 ml-3 shrink-0">
          {confirmDelete ? (
            <>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDeletePack}
                disabled={deleteLoading}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-destructive text-destructive-foreground font-bold hover:bg-destructive/80 transition-colors flex items-center gap-1"
              >
                {deleteLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                Confirmer
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`mx-5 mb-3 px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
          feedback.type === "ok"
            ? "bg-accent/15 border border-accent/30 text-accent"
            : "bg-destructive/15 border border-destructive/30 text-destructive"
        }`}>
          {feedback.type === "ok" ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {feedback.msg}
        </div>
      )}

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-border/40 px-5 py-4 space-y-5">
          {/* Add memes */}
          <form onSubmit={handleAddMemes} className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" /> Ajouter des mèmes
            </label>
            <div className="flex gap-2">
              <textarea
                value={addUrlsText}
                onChange={(e) => setAddUrlsText(e.target.value)}
                placeholder={"https://media.giphy.com/...\nhttps://..."}
                rows={3}
                className="flex-1 px-3 py-2 rounded-xl bg-muted/50 border-2 border-border focus:border-primary outline-none transition-colors text-xs font-mono resize-none leading-relaxed"
              />
              <button
                type="submit"
                disabled={addLoading || !addUrlsText.trim()}
                className="px-4 rounded-xl bg-gradient-to-r from-accent to-accent/80 text-accent-foreground font-bold text-xs hover:from-accent/90 hover:to-accent/70 disabled:opacity-50 transition-all flex flex-col items-center justify-center gap-1 min-w-[70px]"
              >
                {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>{addLoading ? "..." : "Ajouter"}</span>
              </button>
            </div>
            {addUrlsText.trim() && (
              <p className="text-[10px] text-muted-foreground">
                {addUrlsText.split("\n").map((u) => u.trim()).filter(Boolean).length} URL(s) à ajouter
              </p>
            )}
          </form>

          {/* Memes grid */}
          {pack.memes.length > 0 ? (
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 mb-2">
                <ImageIcon className="w-3.5 h-3.5" /> Mèmes ({pack.memes.length})
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                {pack.memes.map((meme, index) => (
                  <MemeThumb
                    key={index}
                    meme={meme}
                    index={index}
                    isRemoving={removingIndex === index}
                    onRemove={() => handleRemoveMeme(index)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucun mème dans ce pack</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [packs, setPacks] = useState<MemePack[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [error, setError] = useState("")

  const loadPacks = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await adminFetch("/api/admin/packs")
      if (res.status === 401) { onLogout(); return }
      const data = await res.json()
      if (res.ok) setPacks(data.packs ?? [])
      else setError(data.error ?? "Erreur de chargement")
    } catch {
      setError("Erreur réseau")
    } finally {
      setLoading(false)
    }
  }, [onLogout])

  useEffect(() => { loadPacks() }, [loadPacks])

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/20 border-2 border-primary/40">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-black bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent leading-tight">
                Farwane Admin
              </h1>
              <p className="text-xs text-muted-foreground">Gestion des packs de mèmes</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadPacks}
              className="p-2 rounded-xl border-2 border-border/50 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all"
              title="Rafraîchir"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-border/50 hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive text-muted-foreground transition-all text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <div className="bg-card/50 backdrop-blur-sm border-2 border-border/40 rounded-xl px-4 py-3">
            <p className="text-2xl font-black text-primary">{packs.length}</p>
            <p className="text-xs text-muted-foreground">Pack{packs.length !== 1 ? "s" : ""} total</p>
          </div>
          <div className="bg-card/50 backdrop-blur-sm border-2 border-border/40 rounded-xl px-4 py-3">
            <p className="text-2xl font-black text-secondary">
              {packs.reduce((sum, p) => sum + p.memes.length, 0)}
            </p>
            <p className="text-xs text-muted-foreground">Mèmes au total</p>
          </div>
          <div className="bg-card/50 backdrop-blur-sm border-2 border-border/40 rounded-xl px-4 py-3 col-span-2 sm:col-span-1">
            <p className="text-2xl font-black text-accent">
              {packs.length > 0 ? Math.round(packs.reduce((sum, p) => sum + p.memes.length, 0) / packs.length) : 0}
            </p>
            <p className="text-xs text-muted-foreground">Mèmes / pack (moy.)</p>
          </div>
        </div>

        {/* Actions bar */}
        <div className="flex items-center justify-between mb-4 animate-in fade-in duration-500 delay-200">
          <h2 className="text-base font-bold flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            Packs de mèmes
          </h2>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold text-sm hover:from-primary/90 hover:to-primary/70 transition-all duration-300 hover:scale-105 shadow-lg shadow-primary/30"
          >
            <Plus className="w-4 h-4" />
            Nouveau pack
          </button>
        </div>

        {/* Packs list */}
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-primary" />
              <p className="text-sm">Chargement des packs...</p>
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          ) : packs.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">Aucun pack pour le moment</p>
              <p className="text-sm mt-1">Crée ton premier pack de mèmes !</p>
            </div>
          ) : (
            packs.map((pack) => (
              <PackCard
                key={pack.id}
                pack={pack}
                onUpdated={loadPacks}
                onDeleted={loadPacks}
              />
            ))
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <CreatePackModal
          onClose={() => setShowCreate(false)}
          onCreated={loadPacks}
        />
      )}
    </div>
  )
}

// ─── Root Page ─────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    const token = sessionStorage.getItem("admin_token")
    setAuthenticated(!!token)
  }, [])

  const handleLogin = () => setAuthenticated(true)
  const handleLogout = () => {
    sessionStorage.removeItem("admin_token")
    setAuthenticated(false)
  }

  // While checking session storage
  if (authenticated === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return authenticated
    ? <AdminDashboard onLogout={handleLogout} />
    : <LoginScreen onLogin={handleLogin} />
}
