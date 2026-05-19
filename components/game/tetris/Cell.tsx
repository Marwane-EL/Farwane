import { CellOptions } from "./types";

interface Props {
  type: CellOptions;
}

function Cell({ type }: Props) {
  return <div className={`${type} cell w-full h-full rounded-[1px]`} />;
}

export default Cell;
