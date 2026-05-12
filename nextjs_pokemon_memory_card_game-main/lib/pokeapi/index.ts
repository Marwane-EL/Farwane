import * as TE from 'fp-ts/TaskEither';
import { shuffle } from '@utils/array';
import {
  MemoryCardState,
  PokeApiResponse,
  Pokemon,
  PokemonState,
} from 'app-types';
import { FetchError, fetchJSON } from 'fp-fetch';
import { map, mapWithIndex } from 'fp-ts/lib/Array';
import { pipe } from 'fp-ts/lib/function';
import { memoryCardState } from '@lib/pokeapi/impl';
import { randomInt } from 'fp-ts/lib/Random';

/** Number of pokemons (cards) to show in the game */
const numberOfPokemons = 8;

/** Offset of the pokemon to fetch */
const pokemonApiOffset = randomInt(0, 780);

/**
 * Fetch list of pokemon to display in the card game
 * @returns `TaskEither` which calls the Poke API to fetch the list of pokemon
 */
export const getPokemonList = (): TE.TaskEither<
  FetchError<string>,
  readonly Pokemon[]
> =>
  pipe(
    fetchJSON<string, PokeApiResponse>(
      `https://pokeapi.co/api/v2/pokemon/?limit=${numberOfPokemons}&offset=${pokemonApiOffset()}`
    ),
    TE.chain(({ results }) =>
      TE.sequenceArray(
        pipe(
          results,
          map((result) => fetchJSON<string, Pokemon>(result.url))
        )
      )
    )
  );

/**
 * Take list of pokemon, duplicate the list, map it to `MemoryCardState`, and shuffle
 * @param pokemonList List of pokemon
 * @returns List of `MemoryCardState` ready for the card game
 */
export const convertPokemonListToCards = (
  pokemonList: readonly Pokemon[]
): MemoryCardState[] =>
  pipe(
    [...pokemonList, ...pokemonList],
    mapWithIndex<Pokemon, PokemonState>((id, pokemon) => ({
      pokemon,
      id,
    })),
    map(memoryCardState.hidden),
    shuffle
  );
