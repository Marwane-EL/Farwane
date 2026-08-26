import { useCallback, useEffect, useState } from "react";
import {
  Block,
  BlockShape,
  BoardShape,
  GhostBlock,
  EmptyCell,
  SHAPES,
} from "./types";
import { useInterval } from "./useInterval";
import {
  useTetrisBoard,
  hasCollisions,
  BOARD_HEIGHT,
  getEmptyBoard,
  getRandomBlock,
} from "./useTetrisBoard";

enum TickSpeed {
  Sliding = 100,
  Fast = 30,
}

function getNormalTickSpeed(score: number): number {
  const level = Math.floor(score / 1000);
  return Math.max(150, 800 - level * 70);
}

interface structuredClone {
  (obj: any): any;
}

export function useTetris(gameOverCallback: () => void, initialScore = 0) {
  const [score, setScore] = useState(initialScore);
  const [upcomingBlocks, setUpcomingBlocks] = useState<Block[]>([]);
  const [isCommitting, setIsCommitting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tickSpeed, setTickSpeed] = useState<number | null>(null);

  //   Scoreboard functions
  function saveScoreToLocalStorage(score: number) {
    localStorage.setItem("tetrisScore", JSON.stringify(score));
  }
  function loadScoreFromLocalStorage(): number {
    const savedScore = localStorage.getItem("tetrisScore");
    return savedScore ? JSON.parse(savedScore) : 0;
  }

  // Board persistence between rounds
  function saveBoardToLocalStorage(boardShape: BoardShape, blocks: Block[]) {
    localStorage.setItem("tetrisBoard", JSON.stringify(boardShape));
    localStorage.setItem("tetrisUpcoming", JSON.stringify(blocks));
  }
  function loadBoardFromLocalStorage(): { board: BoardShape | null; blocks: Block[] | null } {
    try {
      const rawBoard = localStorage.getItem("tetrisBoard");
      const rawBlocks = localStorage.getItem("tetrisUpcoming");
      return {
        board: rawBoard ? JSON.parse(rawBoard) : null,
        blocks: rawBlocks ? JSON.parse(rawBlocks) : null,
      };
    } catch {
      return { board: null, blocks: null };
    }
  }

  function getGhostPosition(): number {
    let ghostRow = droppingRow;
    while (!hasCollisions(board, droppingShape, ghostRow + 1, droppingColumn)) {
      ghostRow++;
    }
    return ghostRow;
  }

  const [
    { board, droppingRow, droppingColumn, droppingBlock, droppingShape },
    dispatchBoardState,
  ] = useTetrisBoard();

  const startGame = useCallback(() => {
    const startingBlocks = [
      getRandomBlock(),
      getRandomBlock(),
      getRandomBlock(),
    ];
    // Récupère le score cumulé et l'état du plateau sauvegardés entre les rounds
    const resumeScore = loadScoreFromLocalStorage();
    const { board: savedBoard, blocks: savedBlocks } = loadBoardFromLocalStorage();

    setScore(resumeScore);
    setIsCommitting(false);
    setIsPlaying(true);
    setTickSpeed(getNormalTickSpeed(resumeScore));

    if (savedBoard && savedBlocks && savedBlocks.length >= 3) {
      // Restaure le plateau et les blocs de la session précédente
      setUpcomingBlocks(savedBlocks);
      dispatchBoardState({
        type: "restore",
        newBoard: savedBoard,
        newBlock: savedBlocks[savedBlocks.length - 1],
      });
    } else {
      // Nouvelle partie vierge
      setUpcomingBlocks(startingBlocks);
      dispatchBoardState({ type: "start" });
    }
  }, [dispatchBoardState]);

  const commitPosition = useCallback(() => {
    if (!hasCollisions(board, droppingShape, droppingRow + 1, droppingColumn)) {
      setIsCommitting(false);
      setTickSpeed(getNormalTickSpeed(score));
      return;
    }

    const newBoard = structuredClone(board) as BoardShape;
    addShapeToBoard(
      newBoard,
      droppingBlock,
      droppingShape,
      droppingRow,
      droppingColumn
    );

    let numCleared = 0;
    for (let row = BOARD_HEIGHT - 1; row >= 0; row--) {
      if (newBoard[row].every((entry) => entry !== EmptyCell.Empty)) {
        numCleared++;
        newBoard.splice(row, 1);
      }
    }

    const newUpcomingBlocks = structuredClone(upcomingBlocks) as Block[];
    const newBlock = newUpcomingBlocks.pop() as Block;
    newUpcomingBlocks.unshift(getRandomBlock());

    // Game over logic here
    if (hasCollisions(board, SHAPES[newBlock].shape, 0, 3)) {
      setIsPlaying(false);
      setTickSpeed(null);
      // Efface l'état du plateau : le prochain "Rejouer" repart d'un plateau vide
      localStorage.removeItem("tetrisBoard");
      localStorage.removeItem("tetrisUpcoming");
      gameOverCallback(); // Call the gameOverCallback function when the game is over
    } else {
      setTickSpeed(getNormalTickSpeed(score + getPoints(numCleared)));
    }
    setUpcomingBlocks(newUpcomingBlocks);
    dispatchBoardState({
      type: "commit",
      newBoard: [...getEmptyBoard(BOARD_HEIGHT - newBoard.length), ...newBoard],
      newBlock,
    });
    setIsCommitting(false);

    const newScore = score + getPoints(numCleared);
    setScore(newScore);

    // Persist score AND board state so both survive round transitions
    saveScoreToLocalStorage(newScore);
    saveBoardToLocalStorage(
      [...getEmptyBoard(BOARD_HEIGHT - newBoard.length), ...newBoard],
      newUpcomingBlocks
    );
  }, [
    board,
    dispatchBoardState,
    droppingBlock,
    droppingColumn,
    droppingRow,
    droppingShape,
    upcomingBlocks,
    score, // Add 'score' to the dependencies array
    gameOverCallback,
  ]);

  const gameTick = useCallback(() => {
    if (isCommitting) {
      commitPosition();
    } else if (
      hasCollisions(board, droppingShape, droppingRow + 1, droppingColumn)
    ) {
      setTickSpeed(TickSpeed.Sliding);
      setIsCommitting(true);
    } else {
      dispatchBoardState({ type: "drop" });
    }
  }, [
    board,
    commitPosition,
    dispatchBoardState,
    droppingColumn,
    droppingRow,
    droppingShape,
    isCommitting,
  ]);

  useInterval(() => {
    if (!isPlaying) {
      return;
    }
    gameTick();
  }, tickSpeed);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    let isPressingLeft = false;
    let isPressingRight = false;
    let moveIntervalID: ReturnType<typeof setTimeout> | undefined;

    const updateMovementInterval = () => {
      clearInterval(moveIntervalID);
      dispatchBoardState({
        type: "move",
        isPressingLeft,
        isPressingRight,
      });
      moveIntervalID = setInterval(() => {
        dispatchBoardState({
          type: "move",
          isPressingLeft,
          isPressingRight,
        });
      }, 300);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) {
        return;
      }

      if (event.key === "ArrowDown") {
        setTickSpeed(TickSpeed.Fast);
      }

      if (event.key === "ArrowUp") {
        dispatchBoardState({
          type: "move",
          isRotating: true,
        });
      }

      if (event.key === "ArrowLeft") {
        isPressingLeft = true;
        updateMovementInterval();
      }

      if (event.key === "ArrowRight") {
        isPressingRight = true;
        updateMovementInterval();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown") {
        setTickSpeed(getNormalTickSpeed(score));
      }

      if (event.key === "ArrowLeft") {
        isPressingLeft = false;
        updateMovementInterval();
      }

      if (event.key === "ArrowRight") {
        isPressingRight = false;
        updateMovementInterval();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    // Cleanup
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      clearInterval(moveIntervalID);
      setTickSpeed(getNormalTickSpeed(score));
    };
  }, [dispatchBoardState, isPlaying, score]);

  const renderedBoard = structuredClone(board) as BoardShape;
  if (isPlaying) {
    addShapeToBoard(
      renderedBoard,
      droppingBlock,
      droppingShape,
      droppingRow,
      droppingColumn
    );

    const ghostRow = getGhostPosition();
    addShapeToBoard(
      renderedBoard,
      droppingBlock,
      droppingShape,
      ghostRow,
      droppingColumn,
      true
    );
  }

  return {
    board: renderedBoard,
    startGame,
    isPlaying,
    score,
    upcomingBlocks,
  };
}

function getPoints(numCleared: number): number {
  switch (numCleared) {
    case 0:
      return 0;
    case 1:
      return 100;
    case 2:
      return 300;
    case 3:
      return 500;
    case 4:
      return 800;
    default:
      throw new Error("Unexpected number of rows cleared");
  }
}

function addShapeToBoard(
  board: BoardShape,
  droppingBlock: Block,
  droppingShape: BlockShape,
  droppingRow: number,
  droppingColumn: number,
  isGhost: boolean = false
) {
  const blockType = isGhost
    ? (`${droppingBlock}Ghost` as GhostBlock)
    : droppingBlock;
  droppingShape
    .filter((row) => row.some((isSet) => isSet))
    .forEach((row: boolean[], rowIndex: number) => {
      row.forEach((isSet: boolean, colIndex: number) => {
        if (isSet) {
          board[droppingRow + rowIndex][droppingColumn + colIndex] = blockType;
        }
      });
    });
}
