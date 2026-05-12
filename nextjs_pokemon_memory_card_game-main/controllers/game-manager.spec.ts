import { memoryCardState, memoryGameState } from '@lib/pokeapi/impl';
import { MemoryCardState, MemoryGameState, PokemonState } from 'app-types';
import {
  gameStateFromMemoryCardList,
  handleClickOnCard,
  resetCardList,
} from './game-manager';

describe('resetCardList', () => {
  it('should reset all not-revealed cards to hidden', () => {
    const cardList: MemoryCardState[] = [
      memoryCardState.showing({
        id: 1,
        pokemon: {
          id: 1,
          name: 'pokemon1',
          sprites: {
            back_female: 'img',
            back_shiny_female: 'img',
            back_default: 'img',
            front_female: 'img',
            front_shiny_female: 'img',
            back_shiny: 'img',
            front_default: 'img',
            front_shiny: 'img',
          },
        },
      }),
      memoryCardState.revealed({
        id: 2,
        pokemon: {
          id: 2,
          name: 'pokemon1',
          sprites: {
            back_female: 'img',
            back_shiny_female: 'img',
            back_default: 'img',
            front_female: 'img',
            front_shiny_female: 'img',
            back_shiny: 'img',
            front_default: 'img',
            front_shiny: 'img',
          },
        },
      }),
    ];
    const cardListResult: MemoryCardState[] = [
      memoryCardState.hidden({
        id: 1,
        pokemon: {
          id: 1,
          name: 'pokemon1',
          sprites: {
            back_female: 'img',
            back_shiny_female: 'img',
            back_default: 'img',
            front_female: 'img',
            front_shiny_female: 'img',
            back_shiny: 'img',
            front_default: 'img',
            front_shiny: 'img',
          },
        },
      }),
      memoryCardState.revealed({
        id: 2,
        pokemon: {
          id: 2,
          name: 'pokemon1',
          sprites: {
            back_female: 'img',
            back_shiny_female: 'img',
            back_default: 'img',
            front_female: 'img',
            front_shiny_female: 'img',
            back_shiny: 'img',
            front_default: 'img',
            front_shiny: 'img',
          },
        },
      }),
    ];

    expect(resetCardList(cardList)).toStrictEqual(cardListResult);
  });
});

describe('gameStateFromMemoryCardList', () => {
  it('should be in all_revealed state when all the cards are revealed', () => {
    const cardList: MemoryCardState[] = [
      memoryCardState.revealed({
        id: 1,
        pokemon: {
          id: 1,
          name: 'pokemon1',
          sprites: {
            back_female: 'img',
            back_shiny_female: 'img',
            back_default: 'img',
            front_female: 'img',
            front_shiny_female: 'img',
            back_shiny: 'img',
            front_default: 'img',
            front_shiny: 'img',
          },
        },
      }),
      memoryCardState.revealed({
        id: 2,
        pokemon: {
          id: 2,
          name: 'pokemon1',
          sprites: {
            back_female: 'img',
            back_shiny_female: 'img',
            back_default: 'img',
            front_female: 'img',
            front_shiny_female: 'img',
            back_shiny: 'img',
            front_default: 'img',
            front_shiny: 'img',
          },
        },
      }),
    ];

    expect(gameStateFromMemoryCardList(cardList)).toStrictEqual(
      memoryGameState.all_revealed()
    );
  });

  it('should be in all_hidden state when all the cards that are not revealed are hidden', () => {
    const cardList: MemoryCardState[] = [
      memoryCardState.hidden({
        id: 1,
        pokemon: {
          id: 1,
          name: 'pokemon1',
          sprites: {
            back_female: 'img',
            back_shiny_female: 'img',
            back_default: 'img',
            front_female: 'img',
            front_shiny_female: 'img',
            back_shiny: 'img',
            front_default: 'img',
            front_shiny: 'img',
          },
        },
      }),
      memoryCardState.revealed({
        id: 2,
        pokemon: {
          id: 2,
          name: 'pokemon1',
          sprites: {
            back_female: 'img',
            back_shiny_female: 'img',
            back_default: 'img',
            front_female: 'img',
            front_shiny_female: 'img',
            back_shiny: 'img',
            front_default: 'img',
            front_shiny: 'img',
          },
        },
      }),
      memoryCardState.hidden({
        id: 3,
        pokemon: {
          id: 3,
          name: 'pokemon1',
          sprites: {
            back_female: 'img',
            back_shiny_female: 'img',
            back_default: 'img',
            front_female: 'img',
            front_shiny_female: 'img',
            back_shiny: 'img',
            front_default: 'img',
            front_shiny: 'img',
          },
        },
      }),
    ];

    expect(gameStateFromMemoryCardList(cardList)).toStrictEqual(
      memoryGameState.all_hidden()
    );
  });

  it('should be in two_showing state when two cards are showing', () => {
    const pokemonState1: PokemonState = {
      id: 1,
      pokemon: {
        id: 1,
        name: 'pokemon1',
        sprites: {
          back_female: 'img',
          back_shiny_female: 'img',
          back_default: 'img',
          front_female: 'img',
          front_shiny_female: 'img',
          back_shiny: 'img',
          front_default: 'img',
          front_shiny: 'img',
        },
      },
    };

    const pokemonState2: PokemonState = {
      id: 3,
      pokemon: {
        id: 3,
        name: 'pokemon1',
        sprites: {
          back_female: 'img',
          back_shiny_female: 'img',
          back_default: 'img',
          front_female: 'img',
          front_shiny_female: 'img',
          back_shiny: 'img',
          front_default: 'img',
          front_shiny: 'img',
        },
      },
    };

    const cardList: MemoryCardState[] = [
      memoryCardState.showing(pokemonState1),
      memoryCardState.revealed({
        id: 2,
        pokemon: {
          id: 2,
          name: 'pokemon1',
          sprites: {
            back_female: 'img',
            back_shiny_female: 'img',
            back_default: 'img',
            front_female: 'img',
            front_shiny_female: 'img',
            back_shiny: 'img',
            front_default: 'img',
            front_shiny: 'img',
          },
        },
      }),
      memoryCardState.showing(pokemonState2),
    ];

    expect(gameStateFromMemoryCardList(cardList)).toStrictEqual(
      memoryGameState.two_showing([pokemonState1, pokemonState2])
    );
  });

  it('should be in one_showing state when one card is showing', () => {
    const pokemonState1: PokemonState = {
      id: 1,
      pokemon: {
        id: 1,
        name: 'pokemon1',
        sprites: {
          back_female: 'img',
          back_shiny_female: 'img',
          back_default: 'img',
          front_female: 'img',
          front_shiny_female: 'img',
          back_shiny: 'img',
          front_default: 'img',
          front_shiny: 'img',
        },
      },
    };

    const pokemonState2: PokemonState = {
      id: 3,
      pokemon: {
        id: 3,
        name: 'pokemon1',
        sprites: {
          back_female: 'img',
          back_shiny_female: 'img',
          back_default: 'img',
          front_female: 'img',
          front_shiny_female: 'img',
          back_shiny: 'img',
          front_default: 'img',
          front_shiny: 'img',
        },
      },
    };

    const cardList: MemoryCardState[] = [
      memoryCardState.hidden(pokemonState1),
      memoryCardState.revealed({
        id: 2,
        pokemon: {
          id: 2,
          name: 'pokemon1',
          sprites: {
            back_female: 'img',
            back_shiny_female: 'img',
            back_default: 'img',
            front_female: 'img',
            front_shiny_female: 'img',
            back_shiny: 'img',
            front_default: 'img',
            front_shiny: 'img',
          },
        },
      }),
      memoryCardState.showing(pokemonState2),
    ];

    expect(gameStateFromMemoryCardList(cardList)).toStrictEqual(
      memoryGameState.one_showing(pokemonState2)
    );
  });
});

describe('handleClickOnCard', () => {
  it('should reset all cards to hidden when game state is two_showing', () => {
    const pokemonState1: PokemonState = {
      id: 1,
      pokemon: {
        id: 1,
        name: 'pokemon1',
        sprites: {
          back_female: 'img',
          back_shiny_female: 'img',
          back_default: 'img',
          front_female: 'img',
          front_shiny_female: 'img',
          back_shiny: 'img',
          front_default: 'img',
          front_shiny: 'img',
        },
      },
    };

    const pokemonState2: PokemonState = {
      id: 3,
      pokemon: {
        id: 3,
        name: 'pokemon1',
        sprites: {
          back_female: 'img',
          back_shiny_female: 'img',
          back_default: 'img',
          front_female: 'img',
          front_shiny_female: 'img',
          back_shiny: 'img',
          front_default: 'img',
          front_shiny: 'img',
        },
      },
    };

    const cardState: MemoryCardState = memoryCardState.hidden(pokemonState1);
    const cardList: MemoryCardState[] = [
      cardState,
      memoryCardState.revealed({
        id: 2,
        pokemon: {
          id: 2,
          name: 'pokemon1',
          sprites: {
            back_female: 'img',
            back_shiny_female: 'img',
            back_default: 'img',
            front_female: 'img',
            front_shiny_female: 'img',
            back_shiny: 'img',
            front_default: 'img',
            front_shiny: 'img',
          },
        },
      }),
      memoryCardState.showing(pokemonState2),
    ];

    const cardStateHidden: MemoryCardState =
      memoryCardState.hidden(pokemonState1);
    const cardListResult: MemoryCardState[] = [
      cardStateHidden,
      memoryCardState.revealed({
        id: 2,
        pokemon: {
          id: 2,
          name: 'pokemon1',
          sprites: {
            back_female: 'img',
            back_shiny_female: 'img',
            back_default: 'img',
            front_female: 'img',
            front_shiny_female: 'img',
            back_shiny: 'img',
            front_default: 'img',
            front_shiny: 'img',
          },
        },
      }),
      memoryCardState.hidden(pokemonState2),
    ];

    const gameState: MemoryGameState = memoryGameState.two_showing([
      pokemonState1,
      pokemonState2,
    ]);
    expect(handleClickOnCard({ gameState, cardState })(cardList)).toStrictEqual(
      cardListResult
    );
  });

  it('should keep the input list when game state is not two_showing and card state is revealed', () => {
    const pokemonState1: PokemonState = {
      id: 1,
      pokemon: {
        id: 1,
        name: 'pokemon1',
        sprites: {
          back_female: 'img',
          back_shiny_female: 'img',
          back_default: 'img',
          front_female: 'img',
          front_shiny_female: 'img',
          back_shiny: 'img',
          front_default: 'img',
          front_shiny: 'img',
        },
      },
    };

    const pokemonState2: PokemonState = {
      id: 3,
      pokemon: {
        id: 3,
        name: 'pokemon1',
        sprites: {
          back_female: 'img',
          back_shiny_female: 'img',
          back_default: 'img',
          front_female: 'img',
          front_shiny_female: 'img',
          back_shiny: 'img',
          front_default: 'img',
          front_shiny: 'img',
        },
      },
    };

    const cardState: MemoryCardState = memoryCardState.revealed(pokemonState1);
    const cardList: MemoryCardState[] = [
      cardState,
      memoryCardState.revealed({
        id: 2,
        pokemon: {
          id: 2,
          name: 'pokemon1',
          sprites: {
            back_female: 'img',
            back_shiny_female: 'img',
            back_default: 'img',
            front_female: 'img',
            front_shiny_female: 'img',
            back_shiny: 'img',
            front_default: 'img',
            front_shiny: 'img',
          },
        },
      }),
      memoryCardState.showing(pokemonState2),
    ];

    const gameState: MemoryGameState =
      memoryGameState.one_showing(pokemonState2);
    expect(handleClickOnCard({ gameState, cardState })(cardList)).toStrictEqual(
      cardList
    );
  });

  it('should keep the input list when game state is all_revealed and card state is hidden', () => {
    const pokemonState1: PokemonState = {
      id: 1,
      pokemon: {
        id: 1,
        name: 'pokemon1',
        sprites: {
          back_female: 'img',
          back_shiny_female: 'img',
          back_default: 'img',
          front_female: 'img',
          front_shiny_female: 'img',
          back_shiny: 'img',
          front_default: 'img',
          front_shiny: 'img',
        },
      },
    };

    const pokemonState2: PokemonState = {
      id: 3,
      pokemon: {
        id: 3,
        name: 'pokemon1',
        sprites: {
          back_female: 'img',
          back_shiny_female: 'img',
          back_default: 'img',
          front_female: 'img',
          front_shiny_female: 'img',
          back_shiny: 'img',
          front_default: 'img',
          front_shiny: 'img',
        },
      },
    };

    const pokemonState3: PokemonState = {
      id: 4,
      pokemon: {
        id: 4,
        name: 'pokemon1',
        sprites: {
          back_female: 'img',
          back_shiny_female: 'img',
          back_default: 'img',
          front_female: 'img',
          front_shiny_female: 'img',
          back_shiny: 'img',
          front_default: 'img',
          front_shiny: 'img',
        },
      },
    };

    const cardState: MemoryCardState = memoryCardState.hidden(pokemonState1);
    const cardList: MemoryCardState[] = [
      cardState,
      memoryCardState.revealed({
        id: 2,
        pokemon: {
          id: 2,
          name: 'pokemon1',
          sprites: {
            back_female: 'img',
            back_shiny_female: 'img',
            back_default: 'img',
            front_female: 'img',
            front_shiny_female: 'img',
            back_shiny: 'img',
            front_default: 'img',
            front_shiny: 'img',
          },
        },
      }),
      memoryCardState.revealed(pokemonState2),
      memoryCardState.revealed(pokemonState3),
    ];

    const gameState: MemoryGameState = memoryGameState.all_revealed();
    expect(handleClickOnCard({ gameState, cardState })(cardList)).toStrictEqual(
      cardList
    );
  });

  it('should convert the given card to showing when game state is not two_showing and the card state is hidden', () => {
    const pokemonState1: PokemonState = {
      id: 1,
      pokemon: {
        id: 1,
        name: 'pokemon1',
        sprites: {
          back_female: 'img',
          back_shiny_female: 'img',
          back_default: 'img',
          front_female: 'img',
          front_shiny_female: 'img',
          back_shiny: 'img',
          front_default: 'img',
          front_shiny: 'img',
        },
      },
    };

    const pokemonState2: PokemonState = {
      id: 3,
      pokemon: {
        id: 3,
        name: 'pokemon1',
        sprites: {
          back_female: 'img',
          back_shiny_female: 'img',
          back_default: 'img',
          front_female: 'img',
          front_shiny_female: 'img',
          back_shiny: 'img',
          front_default: 'img',
          front_shiny: 'img',
        },
      },
    };

    const cardState: MemoryCardState = memoryCardState.hidden(pokemonState1);
    const cardList: MemoryCardState[] = [
      cardState,
      memoryCardState.revealed({
        id: 2,
        pokemon: {
          id: 2,
          name: 'pokemon1',
          sprites: {
            back_female: 'img',
            back_shiny_female: 'img',
            back_default: 'img',
            front_female: 'img',
            front_shiny_female: 'img',
            back_shiny: 'img',
            front_default: 'img',
            front_shiny: 'img',
          },
        },
      }),
      memoryCardState.hidden(pokemonState2),
    ];

    const cardStateShowing: MemoryCardState =
      memoryCardState.showing(pokemonState1);
    const cardListResult: MemoryCardState[] = [
      cardStateShowing,
      memoryCardState.revealed({
        id: 2,
        pokemon: {
          id: 2,
          name: 'pokemon1',
          sprites: {
            back_female: 'img',
            back_shiny_female: 'img',
            back_default: 'img',
            front_female: 'img',
            front_shiny_female: 'img',
            back_shiny: 'img',
            front_default: 'img',
            front_shiny: 'img',
          },
        },
      }),
      memoryCardState.hidden(pokemonState2),
    ];

    const gameState: MemoryGameState = memoryGameState.all_hidden();
    expect(handleClickOnCard({ gameState, cardState })(cardList)).toStrictEqual(
      cardListResult
    );
  });

  it('should convert the given card to hidden when game state is not two_showing and the card state is showing', () => {
    const pokemonState1: PokemonState = {
      id: 1,
      pokemon: {
        id: 1,
        name: 'pokemon1',
        sprites: {
          back_female: 'img',
          back_shiny_female: 'img',
          back_default: 'img',
          front_female: 'img',
          front_shiny_female: 'img',
          back_shiny: 'img',
          front_default: 'img',
          front_shiny: 'img',
        },
      },
    };

    const pokemonState2: PokemonState = {
      id: 3,
      pokemon: {
        id: 3,
        name: 'pokemon1',
        sprites: {
          back_female: 'img',
          back_shiny_female: 'img',
          back_default: 'img',
          front_female: 'img',
          front_shiny_female: 'img',
          back_shiny: 'img',
          front_default: 'img',
          front_shiny: 'img',
        },
      },
    };

    const cardState: MemoryCardState = memoryCardState.showing(pokemonState1);
    const cardList: MemoryCardState[] = [
      cardState,
      memoryCardState.revealed({
        id: 2,
        pokemon: {
          id: 2,
          name: 'pokemon1',
          sprites: {
            back_female: 'img',
            back_shiny_female: 'img',
            back_default: 'img',
            front_female: 'img',
            front_shiny_female: 'img',
            back_shiny: 'img',
            front_default: 'img',
            front_shiny: 'img',
          },
        },
      }),
      memoryCardState.hidden(pokemonState2),
    ];

    const cardStateHidden: MemoryCardState =
      memoryCardState.hidden(pokemonState1);
    const cardListResult: MemoryCardState[] = [
      cardStateHidden,
      memoryCardState.revealed({
        id: 2,
        pokemon: {
          id: 2,
          name: 'pokemon1',
          sprites: {
            back_female: 'img',
            back_shiny_female: 'img',
            back_default: 'img',
            front_female: 'img',
            front_shiny_female: 'img',
            back_shiny: 'img',
            front_default: 'img',
            front_shiny: 'img',
          },
        },
      }),
      memoryCardState.hidden(pokemonState2),
    ];

    const gameState: MemoryGameState =
      memoryGameState.one_showing(pokemonState1);
    expect(handleClickOnCard({ gameState, cardState })(cardList)).toStrictEqual(
      cardListResult
    );
  });

  it('should convert the current showing card and the card clicked to showing when game state is one_showing and the two cards are different', () => {
    const pokemonState1: PokemonState = {
      id: 1,
      pokemon: {
        id: 1,
        name: 'pokemon1',
        sprites: {
          back_female: 'img',
          back_shiny_female: 'img',
          back_default: 'img',
          front_female: 'img',
          front_shiny_female: 'img',
          back_shiny: 'img',
          front_default: 'img',
          front_shiny: 'img',
        },
      },
    };

    const pokemonState2: PokemonState = {
      id: 3,
      pokemon: {
        id: 3,
        name: 'pokemon1',
        sprites: {
          back_female: 'img',
          back_shiny_female: 'img',
          back_default: 'img',
          front_female: 'img',
          front_shiny_female: 'img',
          back_shiny: 'img',
          front_default: 'img',
          front_shiny: 'img',
        },
      },
    };

    const cardState: MemoryCardState = memoryCardState.hidden(pokemonState1);
    const cardList: MemoryCardState[] = [
      cardState,
      memoryCardState.revealed({
        id: 2,
        pokemon: {
          id: 2,
          name: 'pokemon1',
          sprites: {
            back_female: 'img',
            back_shiny_female: 'img',
            back_default: 'img',
            front_female: 'img',
            front_shiny_female: 'img',
            back_shiny: 'img',
            front_default: 'img',
            front_shiny: 'img',
          },
        },
      }),
      memoryCardState.showing(pokemonState2),
    ];

    const cardStateShowing: MemoryCardState =
      memoryCardState.showing(pokemonState1);
    const cardListResult: MemoryCardState[] = [
      cardStateShowing,
      memoryCardState.revealed({
        id: 2,
        pokemon: {
          id: 2,
          name: 'pokemon1',
          sprites: {
            back_female: 'img',
            back_shiny_female: 'img',
            back_default: 'img',
            front_female: 'img',
            front_shiny_female: 'img',
            back_shiny: 'img',
            front_default: 'img',
            front_shiny: 'img',
          },
        },
      }),
      memoryCardState.showing(pokemonState2),
    ];

    const gameState: MemoryGameState =
      memoryGameState.one_showing(pokemonState2);
    expect(handleClickOnCard({ gameState, cardState })(cardList)).toStrictEqual(
      cardListResult
    );
  });

  it('should convert the current showing card and the card clicked to revealed when game state is one_showing and the two cards are equal', () => {
    const pokemonState1: PokemonState = {
      id: 1,
      pokemon: {
        id: 1,
        name: 'pokemon1',
        sprites: {
          back_female: 'img',
          back_shiny_female: 'img',
          back_default: 'img',
          front_female: 'img',
          front_shiny_female: 'img',
          back_shiny: 'img',
          front_default: 'img',
          front_shiny: 'img',
        },
      },
    };

    const pokemonState2: PokemonState = {
      id: 3,
      pokemon: {
        id: 1,
        name: 'pokemon1',
        sprites: {
          back_female: 'img',
          back_shiny_female: 'img',
          back_default: 'img',
          front_female: 'img',
          front_shiny_female: 'img',
          back_shiny: 'img',
          front_default: 'img',
          front_shiny: 'img',
        },
      },
    };

    const cardState: MemoryCardState = memoryCardState.hidden(pokemonState1);
    const cardList: MemoryCardState[] = [
      cardState,
      memoryCardState.revealed({
        id: 2,
        pokemon: {
          id: 2,
          name: 'pokemon1',
          sprites: {
            back_female: 'img',
            back_shiny_female: 'img',
            back_default: 'img',
            front_female: 'img',
            front_shiny_female: 'img',
            back_shiny: 'img',
            front_default: 'img',
            front_shiny: 'img',
          },
        },
      }),
      memoryCardState.showing(pokemonState2),
    ];

    const cardStateRevealed: MemoryCardState =
      memoryCardState.revealed(pokemonState1);
    const cardListResult: MemoryCardState[] = [
      cardStateRevealed,
      memoryCardState.revealed({
        id: 2,
        pokemon: {
          id: 2,
          name: 'pokemon1',
          sprites: {
            back_female: 'img',
            back_shiny_female: 'img',
            back_default: 'img',
            front_female: 'img',
            front_shiny_female: 'img',
            back_shiny: 'img',
            front_default: 'img',
            front_shiny: 'img',
          },
        },
      }),
      memoryCardState.revealed(pokemonState2),
    ];

    const gameState: MemoryGameState =
      memoryGameState.one_showing(pokemonState2);
    expect(handleClickOnCard({ gameState, cardState })(cardList)).toStrictEqual(
      cardListResult
    );
  });
});
