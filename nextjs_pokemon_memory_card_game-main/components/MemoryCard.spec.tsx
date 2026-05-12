import React from 'react';

// No relative import, 'custom-renderer' is recognized
import { render, screen } from 'custom-renderer';
import MemoryCard from './MemoryCard';
import { memoryCardState } from '@lib/pokeapi/impl';

it('should display a placeholder image when card is hidden', () => {
  const { getByAltText } = render(
    <MemoryCard
      handleClick={() => {
        /** */
      }}
      cardState={memoryCardState.hidden({
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
      })}
    />
  );

  const img = getByAltText('') as HTMLImageElement;
  expect(img.src).toBe(
    'https://image.flaticon.com/icons/png/512/287/287221.png'
  );
  screen.debug();
});

it('should display a the front_default pokemon sprite image when card is showing', () => {
  const front_default = 'front_default';
  const { getByAltText } = render(
    <MemoryCard
      handleClick={() => {
        /** */
      }}
      cardState={memoryCardState.showing({
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
            front_default,
            front_shiny: 'img',
          },
        },
      })}
    />
  );

  const img = getByAltText('') as HTMLImageElement;
  expect(img.src).toBe(`http://localhost/${front_default}`);
  screen.debug();
});

it('should display a the front_default pokemon sprite image when card is revealed', () => {
  const front_default = 'front_default';
  const { getByAltText } = render(
    <MemoryCard
      handleClick={() => {
        /** */
      }}
      cardState={memoryCardState.revealed({
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
            front_default,
            front_shiny: 'img',
          },
        },
      })}
    />
  );

  const img = getByAltText('') as HTMLImageElement;
  expect(img.src).toBe(`http://localhost/${front_default}`);
  screen.debug();
});
