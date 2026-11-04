// Tiny DOM builder shared by the pages. Text is always set as text (never innerHTML),
// so anything typed by people or returned by TMDB can't inject markup.
export function h(tag, props = {}, ...kids) {
  const el = Object.assign(document.createElement(tag), props);
  for (const k of kids.flat()) if (k != null) el.append(k);
  return el;
}
