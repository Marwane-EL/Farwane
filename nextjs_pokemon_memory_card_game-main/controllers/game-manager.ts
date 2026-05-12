import * as O from 'fp-ts/Option';
import {
  matchExhaustive,
  matchWildcard,
  WILDCARD,
} from '@practical-fp/union-types';
import { MemoryCardState, MemoryGameState } from 'app-types';
import { every, filter, map } from 'fp-ts/lib/Array';
import { pipe } from 'fp-ts/lib/function';
import {
  eqMemoryCardState,
  eqPokemon,
  memoryCardState,
  memoryGameState,
} from '@lib/pokeapi/impl';
import { updateWhere } from '@utils/array';

/**
 * Derive `MemoryGameState` from current list of card in the game
 * @param cardList Current list of `MemoryCardState` in the game
 * @returns Current `MemoryGameState` of the game
 */
export const gameStateFromMemoryCardList = (
  cardList: MemoryCardState[]
): MemoryGameState =>
  pipe(
    cardList,
    every(memoryCardState.revealed.is),
    (isAllRevealed): O.Option<MemoryGameState> =>
      isAllRevealed ? O.of(memoryGameState.all_revealed()) : O.none,
    O.alt(() =>
      pipe(
        cardList,
        filter((cardState) => !memoryCardState.revealed.is(cardState)),
        every(memoryCardState.hidden.is),
        (isAllHidden): O.Option<MemoryGameState> =>
          isAllHidden ? O.of(memoryGameState.all_hidden()) : O.none
      )
    ),
    O.getOrElse(
      (): MemoryGameState =>
        pipe(cardList, filter(memoryCardState.showing.is), (showingCards) =>
          showingCards.length === 2
            ? memoryGameState.two_showing([
                showingCards[0].value,
                showingCards[1].value,
              ])
            : memoryGameState.one_showing(showingCards[0].value)
        )
    )
  );

/**
 * When the user clicks a card, update the state of the game
 * @param param0 Current `cardState` and `gameState`
 * @returns New list of memory card updated based on the current state
 */
export const handleClickOnCard =
  ({
    cardState,
    gameState,
  }: {
    gameState: MemoryGameState;
    cardState: MemoryCardState;
  }) =>
  (cardList: MemoryCardState[]): MemoryCardState[] =>
    matchWildcard(gameState, {
      two_showing: () => resetCardList(cardList),
      [WILDCARD]: () =>
        matchExhaustive(cardState, {
          hidden: (pokemon): MemoryCardState[] =>
            matchExhaustive(gameState, {
              all_hidden: (): MemoryCardState[] =>
                pipe(
                  cardList,
                  updateWhere<MemoryCardState>(
                    cardState,
                    eqMemoryCardState
                  )(memoryCardState.showing(pokemon))
                ),
              one_showing: (showingPokemon): MemoryCardState[] =>
                eqPokemon.equals(pokemon.pokemon, showingPokemon.pokemon)
                  ? pipe(
                      cardList,
                      updateWhere(
                        cardState,
                        eqMemoryCardState
                      )(memoryCardState.revealed(pokemon)),
                      updateWhere<MemoryCardState>(
                        memoryCardState.showing(showingPokemon),
                        eqMemoryCardState
                      )(memoryCardState.revealed(showingPokemon))
                    )
                  : pipe(
                      cardList,
                      updateWhere<MemoryCardState>(
                        cardState,
                        eqMemoryCardState
                      )(memoryCardState.showing(pokemon)),
                      updateWhere<MemoryCardState>(
                        memoryCardState.showing(showingPokemon),
                        eqMemoryCardState
                      )(memoryCardState.showing(showingPokemon))
                    ),
              all_revealed: (): MemoryCardState[] => cardList,
              two_showing: (): MemoryCardState[] => cardList,
            }),
          showing: (pokemonData): MemoryCardState[] =>
            pipe(
              cardList,
              updateWhere<MemoryCardState>(
                cardState,
                eqMemoryCardState
              )(memoryCardState.hidden(pokemonData))
            ),
          revealed: (): MemoryCardState[] => cardList,
        }),
    });

/**
 * Convert all cards which are not yet revealed to hidden
 * @param cardList List of card to reset
 * @returns List of card all hidden
 */
export const resetCardList = (cardList: MemoryCardState[]): MemoryCardState[] =>
  pipe(
    cardList,
    map((cardState) =>
      memoryCardState.revealed.is(cardState)
        ? cardState
        : memoryCardState.hidden(cardState.value)
    )
  );
