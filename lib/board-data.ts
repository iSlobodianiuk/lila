import type { Cell } from "./types";
import { CELL_DESCRIPTIONS } from "@/src/data/cellDescriptions";

export const TOTAL_CELLS = 72;
export const COLS = 9;
export const ROWS = 8;
export const GOAL_CELL = 68;

type CellBase = {
  id: number;
  name: string;
  original: string;
  arrowTo?: number;
  snakeTo?: number;
};

const BOARD_CELLS_BASE: CellBase[] = [
  { id: 1, name: "Народження", original: "Janma" },
  { id: 2, name: "Ілюзія", original: "Maya" },
  { id: 3, name: "Гнів", original: "Krodha" },
  { id: 4, name: "Жадібність", original: "Lobha" },
  { id: 5, name: "Матеріальний світ", original: "Bhu Loka" },
  { id: 6, name: "Омана", original: "Moha" },
  { id: 7, name: "Марнославство", original: "Mada" },
  { id: 8, name: "Алчність", original: "Matsara" },
  { id: 9, name: "Зона комфорту", original: "Kama Loka", arrowTo: 31 },
  { id: 10, name: "Очищення", original: "Tapa Loka", arrowTo: 23 },
  { id: 11, name: "Розвага", original: "Gandharva" },
  { id: 12, name: "Заздрість", original: "Irshya", snakeTo: 8 },
  { id: 13, name: "Нікчемність", original: "Apatra" },
  { id: 14, name: "Насолода", original: "Bhuvar Loka" },
  { id: 15, name: "Фантазія", original: "Naga Loka" },
  { id: 16, name: "Ревність", original: "Dwesha", snakeTo: 4 },
  { id: 17, name: "Співчуття", original: "Daya" },
  { id: 18, name: "Радість", original: "Yaksha Loka" },
  { id: 19, name: "Карма", original: "Karma Loka" },
  { id: 20, name: "Благодійність", original: "Dana", arrowTo: 32 },
  { id: 21, name: "Спокута", original: "Prayaschitta" },
  { id: 22, name: "План дхарми", original: "Dharma Loka", arrowTo: 60 },
  { id: 23, name: "Сила наміру", original: "Swarga Loka" },
  { id: 24, name: "Погана компанія", original: "Kusangam", snakeTo: 7 },
  { id: 25, name: "Сильне оточення", original: "Sat-Sangam" },
  { id: 26, name: "Печаль", original: "Dukha" },
  { id: 27, name: "Служіння", original: "Paropakara", arrowTo: 41 },
  { id: 28, name: "Істинна віра", original: "Saguna", arrowTo: 50 },
  { id: 29, name: "Знецінення", original: "Adharma", snakeTo: 5 },
  { id: 30, name: "Хороші тенденції", original: "Sat-Vasana" },
  { id: 31, name: "Святість", original: "Maharloka" },
  { id: 32, name: "Любов", original: "Janarloka" },
  { id: 33, name: "Інтуїція", original: "Gandha" },
  { id: 34, name: "Смак", original: "Rasa" },
  { id: 35, name: "Страждання", original: "Naraka" },
  { id: 36, name: "Ясна свідомість", original: "Suddha-Chitta" },
  { id: 37, name: "Справжня мудрість", original: "Jnana", arrowTo: 66 },
  { id: 38, name: "Прана компас", original: "Prana-Loka" },
  { id: 39, name: "Апана порятунок", original: "Apana-Loka" },
  { id: 40, name: "Поток енергій", original: "Vyana-Loka" },
  { id: 41, name: "Самореалізація", original: "Manushya" },
  { id: 42, name: "Вогонь", original: "Agni Loka" },
  { id: 43, name: "Народження людини", original: "Manushya-Janma" },
  { id: 44, name: "Незнання", original: "Avidya", snakeTo: 9 },
  { id: 45, name: "Правильне знання", original: "Vidya", arrowTo: 67 },
  { id: 46, name: "Розрізнення", original: "Viveka", arrowTo: 62 },
  { id: 47, name: "Нейтральність", original: "Saumya" },
  { id: 48, name: "Сонце", original: "Chandra Loka" },
  { id: 49, name: "Місяць", original: "Surya Loka" },
  { id: 50, name: "Аскеза", original: "Tapas" },
  { id: 51, name: "Земля", original: "Prithvi" },
  { id: 52, name: "Насильство", original: "Himsa", snakeTo: 35 },
  { id: 53, name: "Вода", original: "Jala" },
  { id: 54, name: "Духовна відданість", original: "Bhakti", arrowTo: 68 },
  { id: 55, name: "Егоїзм", original: "Ahamkara", snakeTo: 3 },
  { id: 56, name: "Звук", original: "Nada" },
  { id: 57, name: "Повітря", original: "Vayu Loka" },
  { id: 58, name: "Сяйво", original: "Tejas" },
  { id: 59, name: "Усвідомленість", original: "Satya Loka" },
  { id: 60, name: "Позитивний інтелект", original: "Su-Buddhi" },
  { id: 61, name: "Негативний інтелект", original: "Dur-Buddhi", snakeTo: 13 },
  { id: 62, name: "Щастя", original: "Sukha" },
  { id: 63, name: "Бездіяльність", original: "Tamas", snakeTo: 2 },
  { id: 64, name: "Феноменальний план", original: "Vijnaya" },
  { id: 65, name: "З'єднання", original: "Akasha" },
  { id: 66, name: "Істина", original: "Ananda" },
  { id: 67, name: "Космічне благо", original: "Pavan-Shudha" },
  { id: 68, name: "Космічна свідомість", original: "Pawan-Shudha" },
  { id: 69, name: "Творець", original: "Brahma Loka" },
  { id: 70, name: "Пасивність", original: "Sattva" },
  { id: 71, name: "Активна свідомість", original: "Rajas" },
  { id: 72, name: "Лінь", original: "Tamas-Guna", snakeTo: 51 },
];

export const BOARD_CELLS: Cell[] = BOARD_CELLS_BASE.map((b) => {
  const d = CELL_DESCRIPTIONS[b.id];
  return {
    ...b,
    description: d?.description ?? "",
  };
});

export function getCell(id: number): Cell | undefined {
  return BOARD_CELLS.find((c) => c.id === id);
}
