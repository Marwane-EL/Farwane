import { BoardShape } from "./types";
import Cell from "./Cell";

interface Props {
  currentBoard: BoardShape;
}

function Board({ currentBoard }: Props) {
  return (
    <div className="z-50 select-none rounded-lg border-2 border-white bg-black p-0.5 h-full max-h-full aspect-[1/2] grid grid-cols-10 grid-rows-[20]">
      {currentBoard.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <Cell key={`${rowIndex}-${colIndex}`} type={cell} />
        ))
      )}
    </div>
  );
}

export default Board;
