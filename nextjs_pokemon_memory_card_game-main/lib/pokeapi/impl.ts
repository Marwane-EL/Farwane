import * as Eq from 'fp-ts/Eq';
import { impl } from '@practical-fp/union-types';
import {
  MemoryCardState,
  MemoryGameState,
  Pokemon,
  PokemonState,
} from 'app-types';

/**
 * Equals comparison between two `Pokemon`
 */
export const eqPokemon = Eq.fromEquals<Pokemon>((p1, p2) => p1.id === p2.id);

/**
 * Equals comparison between two `PokemonState`
 */
const eqPokemonState = Eq.fromEquals<PokemonState>(
  (ps1, ps2) => ps1.id === ps2.id
);

/**
 * Equals comparison between two `MemoryCardState`
 */
export const eqMemoryCardState = Eq.fromEquals<MemoryCardState>((s1, s2) =>
  eqPokemonState.equals(s1.value, s2.value)
);

export const memoryCardState = impl<MemoryCardState>();
export const memoryGameState = impl<MemoryGameState>();
