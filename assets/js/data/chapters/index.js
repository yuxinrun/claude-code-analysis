/* ============================================================
   Chapter registry · 17 chapters across five parts
   ============================================================ */

import { PART1 } from "./part1.js";
import { PART2 } from "./part2.js";
import { PART3 } from "./part3.js";
import { PART4 } from "./part4.js";
import { PART5 } from "./part5.js";
import { PART6 } from "./part6.js";
import { PART7 } from "./part7.js";

export const CHAPTERS = [
  ...PART1,
  ...PART2,
  ...PART3,
  ...PART4,
  ...PART5,
  ...PART6,
  ...PART7,
];

export const chapterIds = CHAPTERS.map((ch) => ch.id);