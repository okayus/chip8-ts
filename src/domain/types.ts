// Branded Types for CHIP-8 domain values

declare const AddressBrand: unique symbol;
declare const ByteBrand: unique symbol;
declare const WordBrand: unique symbol;
declare const NibbleBrand: unique symbol;
declare const RegisterIndexBrand: unique symbol;

/** 12-bit memory address (0x000–0xFFF) */
export type Address = number & { readonly [AddressBrand]: typeof AddressBrand };

/** 8-bit unsigned value (0x00–0xFF) */
export type Byte = number & { readonly [ByteBrand]: typeof ByteBrand };

/** 16-bit unsigned value (0x0000–0xFFFF) */
export type Word = number & { readonly [WordBrand]: typeof WordBrand };

/** 4-bit unsigned value (0x0–0xF) */
export type Nibble = number & { readonly [NibbleBrand]: typeof NibbleBrand };

/** Register index (0–15, referencing V0–VF) */
export type RegisterIndex = number & { readonly [RegisterIndexBrand]: typeof RegisterIndexBrand };

// Smart constructors

export function mkAddress(n: number): Address {
  if (!Number.isInteger(n) || n < 0x000 || n > 0xfff) {
    throw new RangeError(`Invalid address: ${n} (must be 0x000–0xFFF)`);
  }
  return n as Address;
}

export function mkByte(n: number): Byte {
  if (!Number.isInteger(n) || n < 0x00 || n > 0xff) {
    throw new RangeError(`Invalid byte: ${n} (must be 0x00–0xFF)`);
  }
  return n as Byte;
}

export function mkWord(n: number): Word {
  if (!Number.isInteger(n) || n < 0x0000 || n > 0xffff) {
    throw new RangeError(`Invalid word: ${n} (must be 0x0000–0xFFFF)`);
  }
  return n as Word;
}

export function mkNibble(n: number): Nibble {
  if (!Number.isInteger(n) || n < 0x0 || n > 0xf) {
    throw new RangeError(`Invalid nibble: ${n} (must be 0x0–0xF)`);
  }
  return n as Nibble;
}

export function mkRegisterIndex(n: number): RegisterIndex {
  if (!Number.isInteger(n) || n < 0 || n > 15) {
    throw new RangeError(`Invalid register index: ${n} (must be 0–15)`);
  }
  return n as RegisterIndex;
}
