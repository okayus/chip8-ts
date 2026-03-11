import type { Address, Byte } from "../domain/types.ts";
import { mkAddress, mkByte } from "../domain/types.ts";

/** Number of general-purpose registers (V0–VF) */
const REGISTER_COUNT = 16;

/** Maximum stack depth */
const STACK_SIZE = 16;

/** Program start address */
const PROGRAM_START: Address = mkAddress(0x200);

/** CPU state for the CHIP-8 emulator */
export interface CpuState {
  /** General-purpose registers V0–VF (8-bit each) */
  readonly v: Uint8Array;
  /** Program counter (12-bit address) */
  pc: Address;
  /** Index register (12-bit address) */
  i: Address;
  /** Stack pointer */
  sp: number;
  /** Call stack (16 entries of 12-bit addresses) */
  readonly stack: Uint16Array;
  /** Delay timer (8-bit, decremented at 60Hz) */
  dt: Byte;
  /** Sound timer (8-bit, decremented at 60Hz) */
  st: Byte;
}

/** Create a fresh CPU state with all values initialized */
export function createInitialCpuState(): CpuState {
  return {
    v: new Uint8Array(REGISTER_COUNT),
    pc: PROGRAM_START,
    i: mkAddress(0),
    sp: 0,
    stack: new Uint16Array(STACK_SIZE),
    dt: mkByte(0),
    st: mkByte(0),
  };
}

/** Push address onto the stack */
export function stackPush(cpu: CpuState, address: Address): void {
  if (cpu.sp >= STACK_SIZE) {
    throw new Error("Stack overflow: stack is full");
  }
  cpu.stack[cpu.sp] = address;
  cpu.sp++;
}

/** Pop address from the stack */
export function stackPop(cpu: CpuState): Address {
  if (cpu.sp <= 0) {
    throw new Error("Stack underflow: stack is empty");
  }
  cpu.sp--;
  return mkAddress(cpu.stack[cpu.sp]);
}
