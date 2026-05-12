import { MemoryCardState, Pokemon, PokemonState } from 'app-types';
import { eqPokemon, eqMemoryCardState, memoryCardState } from './impl';

describe('eqPokemon', () => {
  it('pokemon with different id are not equal', () => {
    const pokemon1: Pokemon = {
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
    };
    const pokemon2: Pokemon = {
      id: 2,
      name: 'pokemon2',
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
    };

    expect(eqPokemon.equals(pokemon1, pokemon2)).toBe(false);
  });

  it('pokemon with same id are equal', () => {
    const pokemon1: Pokemon = {
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
    };
    const pokemon2: Pokemon = {
      id: 1,
      name: 'pokemon2',
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
    };

    expect(eqPokemon.equals(pokemon1, pokemon2)).toBe(true);
  });
});

describe('eqMemoryCardState', () => {
  it('pokemon state with different id are not equal', () => {
    const pokemon1: Pokemon = {
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
    };
    const pokemon2: Pokemon = {
      id: 2,
      name: 'pokemon2',
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
    };

    const pokemonState1: PokemonState = {
      id: 1,
      pokemon: pokemon1,
    };
    const pokemonState2: PokemonState = {
      id: 2,
      pokemon: pokemon2,
    };

    const cardState1: MemoryCardState = memoryCardState.hidden(pokemonState1);
    const cardState2: MemoryCardState = memoryCardState.hidden(pokemonState2);

    expect(eqMemoryCardState.equals(cardState1, cardState2)).toBe(false);
  });

  it('pokemon state with same id are equal', () => {
    const pokemon1: Pokemon = {
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
    };
    const pokemon2: Pokemon = {
      id: 2,
      name: 'pokemon2',
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
    };

    const pokemonState1: PokemonState = {
      id: 1,
      pokemon: pokemon1,
    };
    const pokemonState2: PokemonState = {
      id: 1,
      pokemon: pokemon2,
    };

    const cardState1: MemoryCardState = memoryCardState.hidden(pokemonState1);
    const cardState2: MemoryCardState = memoryCardState.hidden(pokemonState2);

    expect(eqMemoryCardState.equals(cardState1, cardState2)).toBe(true);
  });
});
