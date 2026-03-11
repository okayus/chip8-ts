import { FONT_DATA, FONT_START_ADDRESS } from "../domain/font.ts";
import type { Address, Byte, Word } from "../domain/types.ts";
import { mkByte, mkWord } from "../domain/types.ts";

/** Total memory size: 4KB */
const MEMORY_SIZE = 4096;

/** ROM programs are loaded starting at this address */
const ROM_START = 0x200;

export class Memory {
  private readonly ram: Uint8Array;

  constructor() {
    this.ram = new Uint8Array(MEMORY_SIZE);
    this.loadFont();
  }

  /** Load built-in font sprites into memory at 0x000–0x04F */
  private loadFont(): void {
    for (let i = 0; i < FONT_DATA.length; i++) {
      this.ram[FONT_START_ADDRESS + i] = FONT_DATA[i];
    }
  }

  /** Read a single byte from memory */
  readByte(address: Address): Byte {
    return mkByte(this.ram[address]);
  }

  /** Write a single byte to memory */
  writeByte(address: Address, value: Byte): void {
    this.ram[address] = value;
  }

  /** Read a 16-bit word (big-endian) from memory */
  readWord(address: Address): Word {
    const high = this.ram[address];
    const low = this.ram[address + 1];
    return mkWord((high << 8) | low);
  }

  /** Load a ROM into memory starting at 0x200 */
  loadRom(rom: Uint8Array): void {
    if (rom.length > MEMORY_SIZE - ROM_START) {
      throw new Error(`ROM too large: ${rom.length} bytes (max ${MEMORY_SIZE - ROM_START} bytes)`);
    }
    this.ram.set(rom, ROM_START);
  }

  /** Reset memory to initial state (clears RAM, reloads font) */
  reset(): void {
    this.ram.fill(0);
    this.loadFont();
  }
}
