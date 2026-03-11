import type { Audio } from "../peripherals/interfaces.ts";

export class WebAudioBeeper implements Audio {
  private audioCtx: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private isPlaying = false;

  private ensureContext(): AudioContext {
    if (!this.audioCtx) {
      this.audioCtx = new AudioContext();
    }
    return this.audioCtx;
  }

  startBeep(): void {
    if (this.isPlaying) return;
    const ctx = this.ensureContext();
    this.oscillator = ctx.createOscillator();
    this.oscillator.type = "square";
    this.oscillator.frequency.setValueAtTime(440, ctx.currentTime);
    this.oscillator.connect(ctx.destination);
    this.oscillator.start();
    this.isPlaying = true;
  }

  stopBeep(): void {
    if (!this.isPlaying || !this.oscillator) return;
    this.oscillator.stop();
    this.oscillator.disconnect();
    this.oscillator = null;
    this.isPlaying = false;
  }
}
