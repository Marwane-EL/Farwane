"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Clock, Send } from "lucide-react"

interface CreationViewProps {
  prompt: string
  currentMemeUrl: string
  onSubmit: (caption: string) => void
}

export function CreationView({ prompt, currentMemeUrl, onSubmit }: CreationViewProps) {
  const [timeLeft, setTimeLeft] = useState(105) // 1:45 in seconds
  const [caption, setCaption] = useState("")

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          onSubmit(caption)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [onSubmit, caption])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleSubmit = () => {
    if (caption.trim()) {
      onSubmit(caption)
    }
  }

  const isUrgent = timeLeft <= 30
  const canSubmit = caption.trim().length > 0

  return (
    <div className="min-h-screen flex flex-col px-4 py-6">
      {/* Timer */}
      <div className="flex justify-center mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
        <div
          className={`flex items-center gap-3 px-6 py-3 rounded-full border-2 transition-all duration-300 ${
            isUrgent
              ? "bg-destructive/20 border-destructive text-destructive animate-pulse"
              : "bg-muted/50 border-border"
          }`}
        >
          <Clock className={`h-6 w-6 ${isUrgent ? "animate-bounce" : ""}`} />
          <span className="text-3xl font-black font-mono tracking-wider">
            {formatTime(timeLeft)}
          </span>
          <span className="text-sm text-muted-foreground">restants</span>
        </div>
      </div>

      {/* Prompt */}
      <Card className="mb-6 border-2 border-primary/50 bg-gradient-to-r from-primary/10 to-accent/10 animate-in fade-in slide-in-from-top-6 duration-500 delay-100">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">Ton defi :</p>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            {'"'}{prompt}{'"'}
          </h2>
        </CardContent>
      </Card>

      {/* Main content - Image and Caption */}
      <div className="flex-1 flex flex-col items-center max-w-3xl mx-auto w-full animate-in fade-in slide-in-from-bottom-6 duration-500 delay-200">
        {/* Imposed Meme Image */}
        <Card className="w-full border-2 border-border/50 bg-card/50 backdrop-blur-sm mb-6">
          <CardContent className="p-6 flex flex-col items-center">
            <p className="text-sm text-muted-foreground mb-4">Image imposee pour cette manche :</p>
            <div className="relative w-full max-w-md aspect-square rounded-xl overflow-hidden bg-muted/30 border-2 border-border/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentMemeUrl}
                alt="Meme impose"
                className="w-full h-full object-contain"
              />
            </div>
          </CardContent>
        </Card>

        {/* Caption Input */}
        <Card className="w-full border-2 border-primary/30 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-center text-lg">
              Ecris ta legende / blague !
            </h3>
            <Textarea
              placeholder="Ta punchline ici..."
              value={caption}
              onChange={(e) => setCaption(e.target.value.slice(0, 150))}
              className="resize-none h-32 text-lg bg-muted/50 border-2 border-border focus:border-primary transition-colors text-center"
              maxLength={150}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                Sois creatif et fais rire les autres !
              </p>
              <p className="text-xs text-muted-foreground">
                {caption.length}/150
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submit button */}
      <div className="flex justify-center mt-6 animate-in fade-in slide-in-from-bottom-8 duration-500 delay-300">
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          size="lg"
          className="h-16 px-12 text-xl font-bold bg-gradient-to-r from-accent to-accent/80 text-accent-foreground shadow-lg shadow-accent/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-accent/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <Send className="mr-2 h-6 w-6" />
          {"J'ai fini !"}
        </Button>
      </div>
    </div>
  )
}
