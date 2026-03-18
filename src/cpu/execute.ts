import { FONT_BYTES_PER_CHAR } from "../domain/font.ts";
import type { Instruction } from "../domain/instruction.ts";
import { mkAddress, mkByte } from "../domain/types.ts";
import type { Memory } from "../emulator/memory.ts";
import type { Peripherals } from "../peripherals/interfaces.ts";
import { DISPLAY_HEIGHT, DISPLAY_WIDTH } from "../peripherals/interfaces.ts";
import type { CpuState } from "./state.ts";
import { stackPop, stackPush } from "./state.ts";

/**
 * Execute a decoded instruction, mutating CPU state and interacting with peripherals.
 */
export function execute(
  cpu: CpuState,
  memory: Memory,
  instruction: Instruction,
  peripherals: Peripherals,
): void {
  switch (instruction.tag) {
    case "NOP":
      break;

    case "CLS":
      peripherals.display.clear();
      break;

    case "BEGIN_DRAW_BATCH":
      peripherals.display.beginDrawBatch();
      break;

    case "END_DRAW_BATCH":
      peripherals.display.endDrawBatch();
      break;

    case "RET":
      cpu.pc = stackPop(cpu);
      break;

    case "JP":
      cpu.pc = instruction.address;
      break;

    case "CALL":
      stackPush(cpu, cpu.pc);
      cpu.pc = instruction.address;
      break;

    case "SE_BYTE":
      if (cpu.v[instruction.vx] === instruction.byte) {
        cpu.pc = mkAddress(cpu.pc + 2);
      }
      break;

    case "SNE_BYTE":
      if (cpu.v[instruction.vx] !== instruction.byte) {
        cpu.pc = mkAddress(cpu.pc + 2);
      }
      break;

    case "SE_VY":
      if (cpu.v[instruction.vx] === cpu.v[instruction.vy]) {
        cpu.pc = mkAddress(cpu.pc + 2);
      }
      break;

    case "LD_BYTE":
      cpu.v[instruction.vx] = instruction.byte;
      break;

    case "ADD_BYTE":
      cpu.v[instruction.vx] = (cpu.v[instruction.vx] + instruction.byte) & 0xff;
      break;

    case "LD_VY":
      cpu.v[instruction.vx] = cpu.v[instruction.vy];
      break;

    case "OR":
      cpu.v[instruction.vx] |= cpu.v[instruction.vy];
      cpu.v[0xf] = 0;
      break;

    case "AND":
      cpu.v[instruction.vx] &= cpu.v[instruction.vy];
      cpu.v[0xf] = 0;
      break;

    case "XOR":
      cpu.v[instruction.vx] ^= cpu.v[instruction.vy];
      cpu.v[0xf] = 0;
      break;

    case "ADD_VY": {
      const sum = cpu.v[instruction.vx] + cpu.v[instruction.vy];
      cpu.v[instruction.vx] = sum & 0xff;
      cpu.v[0xf] = sum > 0xff ? 1 : 0;
      break;
    }

    case "SUB": {
      const vx = cpu.v[instruction.vx];
      const vy = cpu.v[instruction.vy];
      cpu.v[instruction.vx] = (vx - vy) & 0xff;
      cpu.v[0xf] = vx >= vy ? 1 : 0;
      break;
    }

    case "SHR": {
      const val = cpu.v[instruction.vy];
      cpu.v[instruction.vx] = val >> 1;
      cpu.v[0xf] = val & 0x1;
      break;
    }

    case "SUBN": {
      const vx = cpu.v[instruction.vx];
      const vy = cpu.v[instruction.vy];
      cpu.v[instruction.vx] = (vy - vx) & 0xff;
      cpu.v[0xf] = vy >= vx ? 1 : 0;
      break;
    }

    case "SHL": {
      const val = cpu.v[instruction.vy];
      cpu.v[instruction.vx] = (val << 1) & 0xff;
      cpu.v[0xf] = (val >> 7) & 0x1;
      break;
    }

    case "SNE_VY":
      if (cpu.v[instruction.vx] !== cpu.v[instruction.vy]) {
        cpu.pc = mkAddress(cpu.pc + 2);
      }
      break;

    case "LD_I":
      cpu.i = instruction.address;
      break;

    case "JP_V0":
      cpu.pc = mkAddress((instruction.address + cpu.v[0]) & 0xfff);
      break;

    case "RND":
      cpu.v[instruction.vx] = Math.floor(Math.random() * 256) & instruction.byte;
      break;

    case "DRW": {
      const xPos = cpu.v[instruction.vx] % DISPLAY_WIDTH;
      const yPos = cpu.v[instruction.vy] % DISPLAY_HEIGHT;
      cpu.v[0xf] = 0;

      for (let row = 0; row < instruction.nibble; row++) {
        const y = yPos + row;
        if (y >= DISPLAY_HEIGHT) break;
        const spriteByte = memory.readByte(mkAddress(cpu.i + row));
        for (let col = 0; col < 8; col++) {
          const x = xPos + col;
          if (x >= DISPLAY_WIDTH) break;
          if ((spriteByte & (0x80 >> col)) !== 0) {
            if (peripherals.display.xorPixel(x, y)) {
              cpu.v[0xf] = 1;
            }
          }
        }
      }
      break;
    }

    case "SKP":
      if (peripherals.keyboard.isKeyPressed(mkByte(cpu.v[instruction.vx]))) {
        cpu.pc = mkAddress(cpu.pc + 2);
      }
      break;

    case "JKP":
      if (peripherals.keyboard.isKeyJustPressed(mkByte(cpu.v[instruction.vx]))) {
        cpu.pc = mkAddress(cpu.pc + 2);
      }
      break;

    case "SKNP":
      if (!peripherals.keyboard.isKeyPressed(mkByte(cpu.v[instruction.vx]))) {
        cpu.pc = mkAddress(cpu.pc + 2);
      }
      break;

    case "LD_VX_DT":
      cpu.v[instruction.vx] = cpu.dt;
      break;

    case "LD_VX_K": {
      const key = peripherals.keyboard.getKeyPress();
      if (key === null) {
        // Block: rewind PC so this instruction is re-executed next cycle
        cpu.pc = mkAddress(cpu.pc - 2);
      } else {
        cpu.v[instruction.vx] = key;
      }
      break;
    }

    case "LD_DT_VX":
      cpu.dt = mkByte(cpu.v[instruction.vx]);
      break;

    case "LD_ST_VX":
      cpu.st = mkByte(cpu.v[instruction.vx]);
      break;

    case "ADD_I_VX":
      cpu.i = mkAddress((cpu.i + cpu.v[instruction.vx]) & 0xfff);
      break;

    case "LD_F_VX":
      cpu.i = mkAddress(cpu.v[instruction.vx] * FONT_BYTES_PER_CHAR);
      break;

    case "LD_B_VX": {
      const val = cpu.v[instruction.vx];
      memory.writeByte(mkAddress(cpu.i), mkByte(Math.floor(val / 100)));
      memory.writeByte(mkAddress(cpu.i + 1), mkByte(Math.floor((val % 100) / 10)));
      memory.writeByte(mkAddress(cpu.i + 2), mkByte(val % 10));
      break;
    }

    case "LD_I_VX":
      for (let r = 0; r <= instruction.vx; r++) {
        memory.writeByte(mkAddress(cpu.i + r), mkByte(cpu.v[r]));
      }
      cpu.i = mkAddress(cpu.i + instruction.vx + 1);
      break;

    case "LD_VX_I":
      for (let r = 0; r <= instruction.vx; r++) {
        cpu.v[r] = memory.readByte(mkAddress(cpu.i + r));
      }
      cpu.i = mkAddress(cpu.i + instruction.vx + 1);
      break;

    default: {
      const _exhaustive: never = instruction;
      throw new Error(`Unhandled instruction: ${JSON.stringify(_exhaustive)}`);
    }
  }
}
