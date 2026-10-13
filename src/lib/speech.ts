/** Спокойный темп и чуть более высокий тон: так системный голос звучит мягче. */
export const SPEECH_RATE = 0.9;
export const SPEECH_PITCH = 1.15;

/** Chrome по умолчанию берёт сетевой голос Google, он звучит суховато и
 *  зависит от сети. Предпочитаем локальный системный голос (на macOS Милена). */
export function pickRussianVoice() {
  const all = window.speechSynthesis?.getVoices() ?? [];
  const russian = all.filter((v) => v.lang.toLowerCase().startsWith("ru"));
  return russian.find((v) => v.localService) ?? russian[0] ?? null;
}

/** Фраза голосом Барсика с теми же настройками, что и на занятии. */
export function makeUtterance(text: string) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ru-RU";
  utterance.rate = SPEECH_RATE;
  utterance.pitch = SPEECH_PITCH;
  const voice = pickRussianVoice();
  if (voice) utterance.voice = voice;
  return utterance;
}
