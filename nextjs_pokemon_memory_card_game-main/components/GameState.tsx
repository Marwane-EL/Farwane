import { matchExhaustive } from '@practical-fp/union-types';
import { MemoryGameState } from 'app-types';
import { ReactElement } from 'react';

export default function GameState({
  gameState,
}: {
  gameState: MemoryGameState;
}): ReactElement {
  return (
    <div>
      <span>
        {matchExhaustive(gameState, {
          all_hidden: () => 'What is next?',
          all_revealed: () => 'Completed!',
          one_showing: ({ pokemon }) => `Where is the other ${pokemon.name}?`,
          two_showing: () => 'Sorry, no match found...',
        })}
      </span>
    </div>
  );
}
