const NOTE_WORDS = [
  "spent",
  "spend",
  "spending",
  "groceries",
  "grocery",
  "coffee",
  "lunch",
  "dinner",
  "breakfast",
  "rent",
  "uber",
  "matcha",
  "paycheck",
  "salary",
  "snacks",
  "laundry",
  "medicine",
  "pharmacy",
  "subscription",
  "electricity",
  "internet",
  "haircut",
  "clothes",
  "bus",
  "metro",
  "treat",
];

export function suggestWord(text: string, cursor: number): { start: number; word: string } | null {
  const match = /([A-Za-z]{2,})$/.exec(text.slice(0, cursor));
  if (!match) return null;
  const prefix = match[1];
  const lower = prefix.toLowerCase();
  const word = NOTE_WORDS.find((item) => item.startsWith(lower) && item.length > lower.length);
  if (!word) return null;
  const completed =
    prefix === lower ? word : prefix[0] === prefix[0].toUpperCase() ? capitalize(word) : word;
  return { start: cursor - prefix.length, word: completed };
}

function capitalize(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
