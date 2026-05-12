import React from 'react';

// No relative import, 'custom-renderer' is recognized
import { render, screen } from 'custom-renderer';
import { memoryGameState } from '@lib/pokeapi/impl';
import GameState from './GameState';

it("should display the message 'What is next?' when the game state is all_hidden", async () => {
  const { findByText } = render(
    <GameState gameState={memoryGameState.all_hidden()} />
  );

  const span = await findByText('What is next?');
  expect(span).toBeVisible();
  screen.debug();
});

it("should display the message 'Where is the other ${pokemon.name}?' when the game state is one_showing", async () => {
  const pokemonName = 'pokemonName';
  const { findByText } = render(
    <GameState
      gameState={memoryGameState.one_showing({
        id: 1,
        pokemon: {
          id: 1,
          name: 'pokemonName',
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
      })}
    />
  );

  const span = await findByText(`Where is the other ${pokemonName}?`);
  expect(span).toBeVisible();
  screen.debug();
});

it("should display the message 'Sorry, no match found...' when the game state is two_showing", async () => {
  const { findByText } = render(
    <GameState
      gameState={memoryGameState.two_showing([
        {
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
        },
        {
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
        },
      ])}
    />
  );

  const span = await findByText('Sorry, no match found...');
  expect(span).toBeVisible();
  screen.debug();
});

it("should display the message 'Completed!' when the game state is all_revealed", async () => {
  const { findByText } = render(
    <GameState gameState={memoryGameState.all_revealed()} />
  );

  const span = await findByText('Completed!');
  expect(span).toBeVisible();
  screen.debug();
});
