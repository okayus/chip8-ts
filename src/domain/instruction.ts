import type { Address, Byte, Nibble, RegisterIndex } from "./types.ts";

/** Discriminated union representing all 35 CHIP-8 instructions */
export type Instruction =
  | { readonly tag: "NOP" }
  | { readonly tag: "CLS" }
  | { readonly tag: "RET" }
  | { readonly tag: "JP"; readonly address: Address }
  | { readonly tag: "CALL"; readonly address: Address }
  | { readonly tag: "SE_BYTE"; readonly vx: RegisterIndex; readonly byte: Byte }
  | { readonly tag: "SNE_BYTE"; readonly vx: RegisterIndex; readonly byte: Byte }
  | { readonly tag: "SE_VY"; readonly vx: RegisterIndex; readonly vy: RegisterIndex }
  | { readonly tag: "LD_BYTE"; readonly vx: RegisterIndex; readonly byte: Byte }
  | { readonly tag: "ADD_BYTE"; readonly vx: RegisterIndex; readonly byte: Byte }
  | { readonly tag: "LD_VY"; readonly vx: RegisterIndex; readonly vy: RegisterIndex }
  | { readonly tag: "OR"; readonly vx: RegisterIndex; readonly vy: RegisterIndex }
  | { readonly tag: "AND"; readonly vx: RegisterIndex; readonly vy: RegisterIndex }
  | { readonly tag: "XOR"; readonly vx: RegisterIndex; readonly vy: RegisterIndex }
  | { readonly tag: "ADD_VY"; readonly vx: RegisterIndex; readonly vy: RegisterIndex }
  | { readonly tag: "SUB"; readonly vx: RegisterIndex; readonly vy: RegisterIndex }
  | { readonly tag: "SHR"; readonly vx: RegisterIndex; readonly vy: RegisterIndex }
  | { readonly tag: "SUBN"; readonly vx: RegisterIndex; readonly vy: RegisterIndex }
  | { readonly tag: "SHL"; readonly vx: RegisterIndex; readonly vy: RegisterIndex }
  | { readonly tag: "SNE_VY"; readonly vx: RegisterIndex; readonly vy: RegisterIndex }
  | { readonly tag: "LD_I"; readonly address: Address }
  | { readonly tag: "JP_V0"; readonly address: Address }
  | { readonly tag: "RND"; readonly vx: RegisterIndex; readonly byte: Byte }
  | {
      readonly tag: "DRW";
      readonly vx: RegisterIndex;
      readonly vy: RegisterIndex;
      readonly nibble: Nibble;
    }
  | { readonly tag: "SKP"; readonly vx: RegisterIndex }
  | { readonly tag: "SKNP"; readonly vx: RegisterIndex }
  | { readonly tag: "LD_VX_DT"; readonly vx: RegisterIndex }
  | { readonly tag: "LD_VX_K"; readonly vx: RegisterIndex }
  | { readonly tag: "LD_DT_VX"; readonly vx: RegisterIndex }
  | { readonly tag: "LD_ST_VX"; readonly vx: RegisterIndex }
  | { readonly tag: "ADD_I_VX"; readonly vx: RegisterIndex }
  | { readonly tag: "LD_F_VX"; readonly vx: RegisterIndex }
  | { readonly tag: "LD_B_VX"; readonly vx: RegisterIndex }
  | { readonly tag: "LD_I_VX"; readonly vx: RegisterIndex }
  | { readonly tag: "LD_VX_I"; readonly vx: RegisterIndex };
