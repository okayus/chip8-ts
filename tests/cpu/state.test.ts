import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createInitialCpuState, stackPop, stackPush } from "../../src/cpu/state.ts";
import { mkAddress } from "../../src/domain/types.ts";

describe("createInitialCpuState", () => {
  it("PC の初期値は 0x200", () => {
    const cpu = createInitialCpuState();
    assert.equal(cpu.pc, 0x200);
  });

  it("レジスタ V0–VF が全て 0", () => {
    const cpu = createInitialCpuState();
    assert.equal(cpu.v.length, 16);
    for (let i = 0; i < 16; i++) {
      assert.equal(cpu.v[i], 0);
    }
  });

  it("I レジスタの初期値は 0", () => {
    const cpu = createInitialCpuState();
    assert.equal(cpu.i, 0);
  });

  it("SP の初期値は 0", () => {
    const cpu = createInitialCpuState();
    assert.equal(cpu.sp, 0);
  });

  it("タイマー DT/ST の初期値は 0", () => {
    const cpu = createInitialCpuState();
    assert.equal(cpu.dt, 0);
    assert.equal(cpu.st, 0);
  });
});

describe("stackPush / stackPop", () => {
  it("push した値を pop で取り出せる", () => {
    const cpu = createInitialCpuState();
    stackPush(cpu, mkAddress(0x300));
    assert.equal(cpu.sp, 1);
    const addr = stackPop(cpu);
    assert.equal(addr, 0x300);
    assert.equal(cpu.sp, 0);
  });

  it("LIFO 順序で取り出せる", () => {
    const cpu = createInitialCpuState();
    stackPush(cpu, mkAddress(0x100));
    stackPush(cpu, mkAddress(0x200));
    stackPush(cpu, mkAddress(0x300));
    assert.equal(stackPop(cpu), 0x300);
    assert.equal(stackPop(cpu), 0x200);
    assert.equal(stackPop(cpu), 0x100);
  });

  it("16 エントリまで push できる", () => {
    const cpu = createInitialCpuState();
    for (let i = 0; i < 16; i++) {
      stackPush(cpu, mkAddress(0x200 + i));
    }
    assert.equal(cpu.sp, 16);
  });

  it("17 回目の push でスタックオーバーフロー", () => {
    const cpu = createInitialCpuState();
    for (let i = 0; i < 16; i++) {
      stackPush(cpu, mkAddress(0x200 + i));
    }
    assert.throws(() => stackPush(cpu, mkAddress(0x300)), Error);
  });

  it("空のスタックから pop でスタックアンダーフロー", () => {
    const cpu = createInitialCpuState();
    assert.throws(() => stackPop(cpu), Error);
  });
});
