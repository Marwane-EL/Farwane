import { Block, SHAPES } from "./types";

interface Props {
  upcomingBlocks: Block[];
}

function UpcomingBlocks({ upcomingBlocks }: Props) {
  return (
    <>
      <div className="mb-4 flex w-full flex-row-reverse gap-8 md:flex-col-reverse">
        {upcomingBlocks.map((block, blockIndex) => {
          const shape = SHAPES[block].shape.filter((row) =>
            row.some((cell) => cell)
          );
          return (
            <div key={blockIndex}>
              {shape.map((row, rowIndex) => {
                return (
                  <div key={rowIndex} className="flex row">
                    {row.map((isSet, cellIndex) => {
                      const cellClass = isSet ? block : "Empty";
                      return (
                        <div
                          key={`${blockIndex}-${rowIndex}-${cellIndex}`}
                          className={`cell w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 ${cellClass} rounded-[2px]`}
                        ></div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </>
  );
}

export default UpcomingBlocks;
