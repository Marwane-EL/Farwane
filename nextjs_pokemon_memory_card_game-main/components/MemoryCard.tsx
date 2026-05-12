/* eslint-disable @next/next/no-img-element */
import { matchExhaustive } from '@practical-fp/union-types';
import { MemoryCardState } from 'app-types';
import { ReactElement } from 'react';

interface ComponentProps {
  cardState: MemoryCardState;
  handleClick: () => void;
}

export default function MemoryCard({
  cardState,
  handleClick,
}: ComponentProps): ReactElement {
  return (
    <div className="flex items-center justify-center py-6 border border-gray-200 shadow bg-gray-50">
      <button type="button" onClick={handleClick}>
        <img
          className="block w-[6rem] h-[6rem]"
          src={matchExhaustive(cardState, {
            hidden: () =>
              'https://image.flaticon.com/icons/png/512/287/287221.png',
            showing: (pokemonData) => pokemonData.pokemon.sprites.front_default,
            revealed: (pokemonData) =>
              pokemonData.pokemon.sprites.front_default,
          })}
          alt=""
        />
      </button>
    </div>
  );
}
