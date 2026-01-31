export const CHOICE = { Yes: 0, No: 1, Wait: 2, Depends: 3 } as const;
export const CHOICE_LABEL: Record<number, string> = {
  0: "Yes",
  1: "No",
  2: "Wait",
  3: "Depends",
};
export const CHOICE_EMOJI: Record<number, string> = {
  0: "👍",
  1: "👎",
  2: "⏳",
  3: "🤷",
};
export function choiceDisplay(choice: number): string {
  return `${CHOICE_EMOJI[choice] ?? ""} ${CHOICE_LABEL[choice] ?? ""}`.trim();
}
