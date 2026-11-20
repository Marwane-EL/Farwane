"use client"

import { toast } from "sonner"
import { PlayerAvatar } from "@/components/game/player-avatar"
import { UserPlus, Check, X, Sparkles, Gamepad2, Send } from "lucide-react"

export function showFriendSuccessToast(
  title: string,
  subtitle: string,
  avatar?: string,
  accent: "emerald" | "purple" = "emerald"
) {
  const borderClass =
    accent === "emerald"
      ? "border-emerald-400 shadow-[4px_4px_0px_rgba(52,211,153,0.45)]"
      : "border-primary shadow-[4px_4px_0px_oklch(0.75_0.25_300_/_0.45)]"
  const badgeClass =
    accent === "emerald"
      ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-300"
      : "border-primary/60 bg-primary/20 text-primary"
  const titleColor = accent === "emerald" ? "text-emerald-400" : "text-primary"

  toast.custom(
    (t) => (
      <div
        className={`w-[340px] sm:w-[375px] rounded-2xl border-2 bg-card/95 backdrop-blur-md p-3.5 text-foreground flex items-center gap-3 ${borderClass}`}
      >
        <div
          className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center text-lg shrink-0 overflow-hidden ${badgeClass}`}
        >
          {avatar ? (
            <PlayerAvatar avatar={avatar} imgClassName="w-full h-full object-cover" />
          ) : (
            <Sparkles className="w-5 h-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-xs font-black uppercase tracking-wider ${titleColor}`}>
            {title}
          </div>
          <div className="text-sm font-bold truncate">{subtitle}</div>
        </div>
        <button
          type="button"
          onClick={() => toast.dismiss(t)}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    ),
    { duration: 4500 }
  )
}

export function showIncomingFriendRequestToast(opts: {
  fromPseudo: string
  fromAvatar: string
  onAccept?: () => void
  onDecline?: () => void
}) {
  toast.custom(
    (t) => (
      <div className="w-[350px] sm:w-[395px] rounded-2xl border-2 border-primary bg-card/95 backdrop-blur-md p-3.5 text-foreground shadow-[5px_5px_0px_oklch(0.75_0.25_300_/_0.5)] flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-xl border-2 border-primary bg-primary/20 flex items-center justify-center text-xl shrink-0 overflow-hidden">
            <PlayerAvatar avatar={opts.fromAvatar} imgClassName="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-primary">
              <UserPlus className="w-3.5 h-3.5" />
              <span>Demande d&apos;ami</span>
            </div>
            <div className="text-sm font-black truncate mt-0.5">
              {opts.fromPseudo}{" "}
              <span className="font-semibold text-muted-foreground">veut t&apos;ajouter !</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => toast.dismiss(t)}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {(opts.onAccept || opts.onDecline) && (
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
            {opts.onDecline && (
              <button
                type="button"
                onClick={() => {
                  toast.dismiss(t)
                  opts.onDecline?.()
                }}
                className="px-3 py-1.5 rounded-xl border-2 border-border bg-muted/40 hover:bg-destructive/20 hover:border-destructive hover:text-destructive text-xs font-black transition-all"
              >
                Refuser
              </button>
            )}
            {opts.onAccept && (
              <button
                type="button"
                onClick={() => {
                  toast.dismiss(t)
                  opts.onAccept?.()
                }}
                className="px-3.5 py-1.5 rounded-xl border-2 border-emerald-400 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-black flex items-center gap-1.5 shadow-[2px_2px_0px_rgba(52,211,153,0.4)] transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                Accepter
              </button>
            )}
          </div>
        )}
      </div>
    ),
    { duration: 12000 }
  )
}

export function showRoomInviteToast(opts: {
  fromPseudo: string
  fromAvatar: string
  roomCode: string
  onJoin: () => void
}) {
  toast.custom(
    (t) => (
      <div className="w-[350px] sm:w-[400px] rounded-2xl border-2 border-amber-400 bg-card/95 backdrop-blur-md p-3.5 text-foreground shadow-[5px_5px_0px_rgba(251,191,36,0.45)] flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl border-2 border-amber-400 bg-amber-500/20 flex items-center justify-center text-xl shrink-0 overflow-hidden">
          <PlayerAvatar avatar={opts.fromAvatar} imgClassName="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-amber-400">
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Invitation Salon · {opts.roomCode}</span>
          </div>
          <div className="text-sm font-black truncate mt-0.5">
            {opts.fromPseudo} t&apos;attend dans sa partie !
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            toast.dismiss(t)
            opts.onJoin()
          }}
          className="px-3.5 py-2 rounded-xl border-2 border-emerald-400 bg-emerald-500/25 hover:bg-emerald-500/35 text-emerald-300 text-xs font-black shrink-0 shadow-[2px_2px_0px_rgba(52,211,153,0.45)] transition-all"
        >
          Rejoindre
        </button>
      </div>
    ),
    { duration: 14000 }
  )
}

export function showRoomInviteSentToast(friendPseudo: string, friendAvatar?: string) {
  toast.custom(
    (t) => (
      <div className="w-[340px] sm:w-[375px] rounded-2xl border-2 border-primary bg-card/95 backdrop-blur-md p-3.5 text-foreground shadow-[4px_4px_0px_oklch(0.75_0.25_300_/_0.45)] flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl border-2 border-primary/60 bg-primary/20 text-primary flex items-center justify-center text-lg shrink-0 overflow-hidden">
          {friendAvatar ? (
            <PlayerAvatar avatar={friendAvatar} imgClassName="w-full h-full object-cover" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-black uppercase tracking-wider text-primary">
            Invitation envoyée
          </div>
          <div className="text-sm font-bold truncate">
            {friendPseudo} a reçu ton invitation au salon !
          </div>
        </div>
        <button
          type="button"
          onClick={() => toast.dismiss(t)}
          className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    ),
    { duration: 4000 }
  )
}
