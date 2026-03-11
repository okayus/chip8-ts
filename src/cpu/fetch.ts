import type { Word } from "../domain/types.ts";
import { mkAddress } from "../domain/types.ts";
import type { Memory } from "../emulator/memory.ts";
import type { CpuState } from "./state.ts";

/**
 * Fetch the next instruction word from memory at the current PC,
 * then advance PC by 2.
 */
export function fetch(cpu: CpuState, memory: Memory): Word {
  const word = memory.readWord(cpu.pc);
  cpu.pc = mkAddress(cpu.pc + 2);
  return word;
}
