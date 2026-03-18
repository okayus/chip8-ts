import { decode } from "../cpu/decode.ts";
import { execute } from "../cpu/execute.ts";
import { fetch } from "../cpu/fetch.ts";
import type { CpuState } from "../cpu/state.ts";
import { createInitialCpuState } from "../cpu/state.ts";
import { mkByte } from "../domain/types.ts";
import type { Peripherals } from "../peripherals/interfaces.ts";
import { Memory } from "./memory.ts";

/** Standard CHIP-8: 600 IPS / 60 Hz = 10 instructions per timer tick */
const CYCLES_PER_TIMER_TICK = 10;

export class Emulator {
  private cpu: CpuState;
  private readonly memory: Memory;
  private readonly peripherals: Peripherals;
  private cycleCounter = 0;

  constructor(peripherals: Peripherals) {
    this.cpu = createInitialCpuState();
    this.memory = new Memory();
    this.peripherals = peripherals;
  }

  /** Execute one CPU cycle: fetch → decode → execute */
  tick(): void {
    const word = fetch(this.cpu, this.memory);
    const instruction = decode(word);
    execute(this.cpu, this.memory, instruction, this.peripherals);
  }

  /** Execute count CPU cycles with interleaved timer decrements every CYCLES_PER_TIMER_TICK instructions */
  step(count: number): void {
    for (let i = 0; i < count; i++) {
      this.tick();
      this.cycleCounter++;
      if (this.cycleCounter >= CYCLES_PER_TIMER_TICK) {
        this.cycleCounter = 0;
        this.tickTimers();
      }
    }
  }

  /** Decrement delay/sound timers. Called by step() every CYCLES_PER_TIMER_TICK cycles */
  tickTimers(): void {
    if (this.cpu.dt > 0) {
      this.cpu.dt = mkByte(this.cpu.dt - 1);
    }
    if (this.cpu.st > 0) {
      this.cpu.st = mkByte(this.cpu.st - 1);
      if (this.cpu.st === 0) {
        this.peripherals.audio.stopBeep();
      }
    }
  }

  /** Load a ROM into memory */
  load(rom: Uint8Array): void {
    this.memory.loadRom(rom);
  }

  /** Reset to initial state */
  reset(): void {
    this.cpu = createInitialCpuState();
    this.memory.reset();
    this.cycleCounter = 0;
  }

  /** Get current CPU state (for debugging) */
  getCpuState(): Readonly<CpuState> {
    return this.cpu;
  }

  /** Get memory (for debugging) */
  getMemory(): Memory {
    return this.memory;
  }
}
