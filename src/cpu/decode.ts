import type { Instruction } from "../domain/instruction.ts";
import type { Word } from "../domain/types.ts";
import { mkAddress, mkByte, mkNibble, mkRegisterIndex } from "../domain/types.ts";

/**
 * Decode a 16-bit CHIP-8 opcode into a typed Instruction.
 * Pure function: no side effects.
 */
export function decode(opcode: Word): Instruction {
  const nnn = mkAddress(opcode & 0x0fff);
  const x = mkRegisterIndex((opcode >> 8) & 0x0f);
  const y = mkRegisterIndex((opcode >> 4) & 0x0f);
  const kk = mkByte(opcode & 0x00ff);
  const n = mkNibble(opcode & 0x000f);

  switch (opcode & 0xf000) {
    case 0x0000:
      switch (opcode) {
        case 0x0000:
          return { tag: "NOP" };
        case 0x00e0:
          return { tag: "CLS" };
        case 0x00f0:
          return { tag: "BEGIN_DRAW_BATCH" };
        case 0x00f1:
          return { tag: "END_DRAW_BATCH" };
        case 0x00ee:
          return { tag: "RET" };
        default:
          throw new Error(`Unknown opcode: 0x${opcode.toString(16).padStart(4, "0")}`);
      }
    case 0x1000:
      return { tag: "JP", address: nnn };
    case 0x2000:
      return { tag: "CALL", address: nnn };
    case 0x3000:
      return { tag: "SE_BYTE", vx: x, byte: kk };
    case 0x4000:
      return { tag: "SNE_BYTE", vx: x, byte: kk };
    case 0x5000:
      return { tag: "SE_VY", vx: x, vy: y };
    case 0x6000:
      return { tag: "LD_BYTE", vx: x, byte: kk };
    case 0x7000:
      return { tag: "ADD_BYTE", vx: x, byte: kk };
    case 0x8000:
      switch (opcode & 0x000f) {
        case 0x0:
          return { tag: "LD_VY", vx: x, vy: y };
        case 0x1:
          return { tag: "OR", vx: x, vy: y };
        case 0x2:
          return { tag: "AND", vx: x, vy: y };
        case 0x3:
          return { tag: "XOR", vx: x, vy: y };
        case 0x4:
          return { tag: "ADD_VY", vx: x, vy: y };
        case 0x5:
          return { tag: "SUB", vx: x, vy: y };
        case 0x6:
          return { tag: "SHR", vx: x, vy: y };
        case 0x7:
          return { tag: "SUBN", vx: x, vy: y };
        case 0xe:
          return { tag: "SHL", vx: x, vy: y };
        default:
          throw new Error(`Unknown opcode: 0x${opcode.toString(16).padStart(4, "0")}`);
      }
    case 0x9000:
      return { tag: "SNE_VY", vx: x, vy: y };
    case 0xa000:
      return { tag: "LD_I", address: nnn };
    case 0xb000:
      return { tag: "JP_V0", address: nnn };
    case 0xc000:
      return { tag: "RND", vx: x, byte: kk };
    case 0xd000:
      return { tag: "DRW", vx: x, vy: y, nibble: n };
    case 0xe000:
      switch (opcode & 0x00ff) {
        case 0x9e:
          return { tag: "SKP", vx: x };
        case 0x9f:
          return { tag: "JKP", vx: x };
        case 0xa1:
          return { tag: "SKNP", vx: x };
        default:
          throw new Error(`Unknown opcode: 0x${opcode.toString(16).padStart(4, "0")}`);
      }
    case 0xf000:
      switch (opcode & 0x00ff) {
        case 0x07:
          return { tag: "LD_VX_DT", vx: x };
        case 0x0a:
          return { tag: "LD_VX_K", vx: x };
        case 0x15:
          return { tag: "LD_DT_VX", vx: x };
        case 0x18:
          return { tag: "LD_ST_VX", vx: x };
        case 0x1e:
          return { tag: "ADD_I_VX", vx: x };
        case 0x29:
          return { tag: "LD_F_VX", vx: x };
        case 0x33:
          return { tag: "LD_B_VX", vx: x };
        case 0x55:
          return { tag: "LD_I_VX", vx: x };
        case 0x65:
          return { tag: "LD_VX_I", vx: x };
        default:
          throw new Error(`Unknown opcode: 0x${opcode.toString(16).padStart(4, "0")}`);
      }
    default:
      throw new Error(`Unknown opcode: 0x${opcode.toString(16).padStart(4, "0")}`);
  }
}
