declare module 'app-types' {
  import('@practical-fp/union-types');
  import { Variant } from '@practical-fp/union-types';

  type ErrorMessage = string;

  interface PokemonSprites {
    back_female: string;
    back_shiny_female: string;
    back_default: string;
    front_female: string;
    front_shiny_female: string;
    back_shiny: string;
    front_default: string;
    front_shiny: string;
  }

  interface Pokemon {
    id: number;
    name: string;
    sprites: PokemonSprites;
  }

  interface PokemonState {
    id: number;
    pokemon: Pokemon;
  }

  interface PokeApiResponseResult {
    name: string;
    url: string;
  }

  interface PokeApiResponse {
    count: number;
    next: string;
    previous: string;
    results: PokeApiResponseResult[];
  }

  type MemoryCardState =
    | Variant<'hidden', PokemonState>
    | Variant<'showing', PokemonState>
    | Variant<'revealed', PokemonState>;

  type MemoryGameState =
    | Variant<'all_hidden'>
    | Variant<'all_revealed'>
    | Variant<'one_showing', PokemonState>
    | Variant<'two_showing', [PokemonState, PokemonState]>;
}
