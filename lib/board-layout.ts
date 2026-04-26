import { BOARD_CELLS, COLS, ROWS } from "./board-data";
import type { Cell } from "./types";

/**
 * Бустрофедонна розкладка дошки Лила.
 * Фізичне розташування: ряд 1 знизу. Парні ряди йдуть зліва направо,
 * непарні (вище парних) — справа наліво.
 *
 * Ряд 1 (низ): 1 → 9 (LTR)
 * Ряд 2:        18 ← 10 (RTL, тобто 10 справа над 9)
 * Ряд 3:       19 → 27 (LTR)
 * ...
 * Ряд 8 (верх): 72 ← 64 (RTL; клітинка 68 у центрі верхнього ряду)
 *
 * Повертає масив рядів зверху вниз — готовий до прямого рендеру.
 */
export const BOARD_GRID: Cell[][] = (() => {
  const rowsTopToBottom: Cell[][] = [];
  for (let r = ROWS; r >= 1; r--) {
    const rowStart = (r - 1) * COLS + 1;
    const rowCells: Cell[] = [];
    for (let i = 0; i < COLS; i++) {
      rowCells.push(BOARD_CELLS[rowStart - 1 + i]);
    }
    if (r % 2 === 0) rowCells.reverse();
    rowsTopToBottom.push(rowCells);
  }
  return rowsTopToBottom;
})();
