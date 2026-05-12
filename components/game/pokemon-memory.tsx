"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Loader2, RotateCcw } from "lucide-react"

interface Pokemon {
  id: number
  name: string
  image: string
}

interface MemoryCard {
  id: string
  pokemonId: number
  image: string
  isFlipped: boolean
  isMatched: boolean
}

export function PokemonMemory() {
  const [cards, setCards] = useState<MemoryCard[]>([])
  const [flippedIndices, setFlippedIndices] = useState<number[]>([])
  const [isLocked, setIsLocked] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPokemons()
  }, [])

  const fetchPokemons = async () => {
    setLoading(true)
    try {
      const offset = Math.floor(Math.random() * 500)
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/?limit=8&offset=${offset}`)
      const data = await res.json()
      
      const pokemonPromises = data.results.map(async (p: any) => {
        const pRes = await fetch(p.url)
        const pData = await pRes.json()
        return {
          id: pData.id,
          name: pData.name,
          image: pData.sprites.front_default || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png'
        }
      })
      
      const pokemons = await Promise.all(pokemonPromises)
      
      const duplicatedCards: MemoryCard[] = [...pokemons, ...pokemons].map((p, index) => ({
        id: `${p.id}-${index}`,
        pokemonId: p.id,
        image: p.image,
        isFlipped: false,
        isMatched: false
      }))
      
      // Shuffle
      const shuffled = duplicatedCards.sort(() => Math.random() - 0.5)
      setCards(shuffled)
    } catch (error) {
      console.error("Failed to fetch pokemons:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCardClick = (index: number) => {
    if (isLocked) return
    if (cards[index].isFlipped || cards[index].isMatched) return

    const newCards = [...cards]
    newCards[index].isFlipped = true
    setCards(newCards)

    const newFlippedIndices = [...flippedIndices, index]
    setFlippedIndices(newFlippedIndices)

    if (newFlippedIndices.length === 2) {
      setIsLocked(true)
      const [firstIndex, secondIndex] = newFlippedIndices

      if (newCards[firstIndex].pokemonId === newCards[secondIndex].pokemonId) {
        // Match
        setTimeout(() => {
          newCards[firstIndex].isMatched = true
          newCards[secondIndex].isMatched = true
          setCards(newCards)
          setFlippedIndices([])
          setIsLocked(false)
        }, 500)
      } else {
        // No match
        setTimeout(() => {
          newCards[firstIndex].isFlipped = false
          newCards[secondIndex].isFlipped = false
          setCards(newCards)
          setFlippedIndices([])
          setIsLocked(false)
        }, 1000)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-4 w-full max-w-2xl mx-auto bg-card/50 backdrop-blur-sm rounded-xl border-2 border-border mt-0 h-full max-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
        <p className="text-muted-foreground animate-pulse text-sm">Chargement du mini-jeu...</p>
      </div>
    )
  }

  const isWin = cards.length > 0 && cards.every((c) => c.isMatched)

  return (
    <div className="flex flex-col items-center p-2 sm:p-3 bg-card/50 backdrop-blur-sm rounded-xl border-2 border-border mt-0 w-full max-w-lg mx-auto shadow-xl h-full max-h-[400px] overflow-hidden">
      <div className="flex justify-between items-center w-full mb-2 shrink-0">
        <h3 className="text-sm sm:text-base font-black bg-gradient-to-r from-blue-500 to-yellow-400 bg-clip-text text-transparent drop-shadow-sm">
          Memory Pokémon
        </h3>
        <button 
          onClick={fetchPokemons}
          className="flex items-center gap-2 text-sm px-4 py-2 bg-muted hover:bg-primary hover:text-primary-foreground text-foreground rounded-full transition-all duration-300 border border-border font-medium"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">{isWin ? "Rejouer" : "Nouvelle partie"}</span>
        </button>
      </div>
      
      <div className="grid grid-cols-4 gap-1 sm:gap-2 w-full flex-1 min-h-0 object-contain max-w-[320px] mx-auto">
        {cards.map((card, index) => {
          const isVisible = card.isFlipped || card.isMatched;
          
          return (
            <Card
              key={card.id} 
              onClick={() => handleCardClick(index)}
              className={`
                relative w-full aspect-square cursor-pointer transition-all duration-300 flex items-center justify-center overflow-hidden
                ${!isVisible ? "hover:scale-105 hover:border-primary/50 border-border/50 bg-gradient-to-br from-muted to-muted/50" : ""}
                ${card.isMatched ? "border-green-500 bg-green-500/10 scale-95 opacity-80" : ""}
                ${isVisible && !card.isMatched ? "border-primary bg-card" : ""}
              `}
            >
              {!isVisible ? (
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[url('https://upload.wikimedia.org/wikipedia/commons/5/53/Pok%C3%A9_Ball_icon.svg')] bg-contain bg-no-repeat bg-center opacity-30 transition-opacity group-hover:opacity-50" />
              ) : (
                <img 
                  src={card.image} 
                  alt="pokemon" 
                  className={`w-10 h-10 sm:w-14 sm:h-14 object-contain drop-shadow-md animate-in zoom-in duration-300 ${card.isMatched ? "animate-bounce" : ""}`} 
                />
              )}
            </Card>
          )
        })}
      </div>
      
      {isWin && (
        <div className="mt-2 text-center animate-in fade-in slide-in-from-bottom-4 duration-500 bg-green-500/20 text-green-600 dark:text-green-400 px-3 py-1.5 rounded-full border border-green-500/30 shrink-0">
          <p className="text-xs sm:text-sm font-bold">Bravo ! Tu as attrapé tous les Pokémon ! 🎉</p>
        </div>
      )}
    </div>
  )
}
