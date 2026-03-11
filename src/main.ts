import { Emulator } from "./emulator/emulator.ts";
import { CanvasDisplay } from "./frontend/canvas-display.ts";
import { KeyboardInput } from "./frontend/keyboard-input.ts";
import { WebAudioBeeper } from "./frontend/web-audio-beeper.ts";

const TICKS_PER_FRAME = 10;

const canvas = document.getElementById("display") as HTMLCanvasElement;
const fileInput = document.getElementById("rom-input") as HTMLInputElement;
const statusEl = document.getElementById("status") as HTMLElement;

const display = new CanvasDisplay(canvas);
const keyboard = new KeyboardInput();
const audio = new WebAudioBeeper();

const emulator = new Emulator({ display, keyboard, audio });

let running = false;

function mainLoop() {
  if (!running) return;

  for (let i = 0; i < TICKS_PER_FRAME; i++) {
    emulator.tick();
  }
  emulator.tickTimers();
  display.render();

  requestAnimationFrame(mainLoop);
}

fileInput.addEventListener("change", async () => {
  const file = fileInput.files?.[0];
  if (!file) return;

  const buffer = await file.arrayBuffer();
  const rom = new Uint8Array(buffer);

  emulator.reset();
  emulator.load(rom);
  running = true;
  statusEl.textContent = `Loaded: ${file.name} (${rom.length} bytes)`;
  requestAnimationFrame(mainLoop);
});
