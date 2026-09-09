// Apenas vozes locais em português: nenhuma gravação de voz ou texto infantil é enviada.
export function hasVoice(): boolean {
  return typeof speechSynthesis !== 'undefined' && speechSynthesis.getVoices().some(v => v.localService && /^pt([-_]|$)/i.test(v.lang));
}
export function stopSpeech(): void { if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel(); }
export function speak(text: string, enabled: boolean): boolean {
  if (!enabled || typeof speechSynthesis === 'undefined') return false;
  const voices = speechSynthesis.getVoices().filter(v => v.localService && /^pt([-_]|$)/i.test(v.lang));
  const voice = voices.find(v => /^pt[-_]BR$/i.test(v.lang)) ?? voices[0];
  if (!voice) return false;
  stopSpeech();
  const message = new SpeechSynthesisUtterance(text);
  message.lang = voice.lang; message.voice = voice; message.rate = 0.83; message.pitch = 1.05;
  speechSynthesis.speak(message);
  return true;
}
