import { Emulator } from "./emulator/emulator.ts";
import { CanvasDisplay } from "./frontend/canvas-display.ts";
import { KeyboardInput } from "./frontend/keyboard-input.ts";
import { WebAudioBeeper } from "./frontend/web-audio-beeper.ts";

const TICKS_PER_FRAME = 10;

const canvas = document.getElementById("display") as HTMLCanvasElement;
const fileInput = document.getElementById("rom-input") as HTMLInputElement;
const romSelect = document.getElementById("rom-select") as HTMLSelectElement;
const resetBtn = document.getElementById("reset-btn") as HTMLButtonElement;
const debugToggle = document.getElementById("debug-toggle") as HTMLButtonElement;
const debugPanel = document.getElementById("debug-panel") as HTMLElement;
const debugRegisters = document.getElementById("debug-registers") as HTMLElement;
const debugMeta = document.getElementById("debug-meta") as HTMLElement;
const statusEl = document.getElementById("status") as HTMLElement;

const display = new CanvasDisplay(canvas);
const keyboard = new KeyboardInput();
const audio = new WebAudioBeeper();

const emulator = new Emulator({ display, keyboard, audio });

let running = false;
let showDebug = false;

function startEmulation(rom: Uint8Array, name: string) {
  emulator.reset();
  emulator.load(rom);
  running = true;
  statusEl.textContent = `Loaded: ${name} (${rom.length} bytes)`;
  requestAnimationFrame(mainLoop);
}

function updateDebugPanel() {
  if (!showDebug) return;
  const cpu = emulator.getCpuState();

  let html = "";
  for (let i = 0; i < 16; i++) {
    const name = `V${i.toString(16).toUpperCase()}`;
    const val = cpu.v[i].toString(16).toUpperCase().padStart(2, "0");
    html += `<span>${name}: <span class="value">0x${val}</span></span>`;
  }
  debugRegisters.innerHTML = html;

  const pc = cpu.pc.toString(16).toUpperCase().padStart(3, "0");
  const i = cpu.i.toString(16).toUpperCase().padStart(3, "0");
  debugMeta.innerHTML =
    `<span>PC: <span class="value">0x${pc}</span></span> | ` +
    `<span>I: <span class="value">0x${i}</span></span> | ` +
    `<span>SP: <span class="value">${cpu.sp}</span></span> | ` +
    `<span>DT: <span class="value">${cpu.dt}</span></span> | ` +
    `<span>ST: <span class="value">${cpu.st}</span></span>`;
}

function mainLoop() {
  if (!running) return;

  for (let i = 0; i < TICKS_PER_FRAME; i++) {
    emulator.tick();
  }
  emulator.tickTimers();
  display.render();
  updateDebugPanel();

  requestAnimationFrame(mainLoop);
}

// ROM file upload
fileInput.addEventListener("change", async () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  const buffer = await file.arrayBuffer();
  startEmulation(new Uint8Array(buffer), file.name);
  romSelect.value = "";
});

// Sample ROM select
romSelect.addEventListener("change", async () => {
  const path = romSelect.value;
  if (!path) return;
  const response = await fetch(path);
  const buffer = await response.arrayBuffer();
  const name = path.split("/").pop() ?? path;
  startEmulation(new Uint8Array(buffer), name);
});

// Reset button
resetBtn.addEventListener("click", () => {
  emulator.reset();
  running = false;
  display.clear();
  display.render();
  statusEl.textContent = "Reset";
});

// Debug toggle
debugToggle.addEventListener("click", () => {
  showDebug = !showDebug;
  debugPanel.classList.toggle("visible", showDebug);
  debugToggle.textContent = showDebug ? "Hide Debug" : "Debug";
});
