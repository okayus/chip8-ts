import { decode } from "../cpu/decode.ts";
import { execute } from "../cpu/execute.ts";
import { fetch } from "../cpu/fetch.ts";
import type { CpuState } from "../cpu/state.ts";
import { createInitialCpuState } from "../cpu/state.ts";
import { mkByte } from "../domain/types.ts";
import type { Peripherals } from "../peripherals/interfaces.ts";
import { Memory } from "./memory.ts";

export class Emulator {
  private cpu: CpuState;
  private readonly memory: Memory;
  private readonly peripherals: Peripherals;

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

  /** Decrement timers (call once per frame at 60Hz) */
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
