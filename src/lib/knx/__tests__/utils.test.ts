import { describe, expect, it } from "@jest/globals";

import {
  decodeGaIntToTriple,
  ensureArray,
  extractText,
  isNumber,
  isObject,
  isString,
  keyEndsWith,
  normalizeDptToDot,
  normalizeDptToHyphen,
  parseAddress,
  toStringIfScalar,
} from "@/lib/knx/utils";

describe("utils", () => {
  it("determines primitive types", () => {
    expect(isObject({ foo: 1 })).toBe(true);
    expect(isObject(null)).toBe(false);
    expect(isString("foo")).toBe(true);
    expect(isString(123)).toBe(false);
    expect(isNumber(42)).toBe(true);
    expect(isNumber(Infinity)).toBe(false);
  });

  it("converts scalars to strings", () => {
    expect(toStringIfScalar("abc")).toBe("abc");
    expect(toStringIfScalar(123)).toBe("123");
    expect(toStringIfScalar({})).toBeUndefined();
  });

  it("wraps non-arrays with ensureArray", () => {
    expect(ensureArray<number>([1, 2])).toEqual([1, 2]);
    expect(ensureArray<number>(undefined)).toEqual([]);
    expect(ensureArray<number>(5)).toEqual([5]);
  });

  it("extracts text from objects using priority keys", () => {
    const source = { title: "Primary", description: 99 };
    expect(extractText(source, ["title", "description"])).toBe("Primary");
    expect(extractText(source, ["missing", "description"])).toBe("99");
    expect(extractText(undefined, ["title"]))
      .toBeUndefined();
  });

  it("checks compound key suffixes", () => {
    expect(keyEndsWith("knx:state", "state")).toBe(true);
    expect(keyEndsWith("device_name", "name")).toBe(true);
    expect(keyEndsWith("device", "name")).toBe(false);
    expect(keyEndsWith("m:status_flag", "flag")).toBe(true);
  });

  it("parses group address strings", () => {
    expect(parseAddress(" 1/2/3 ")).toEqual({ main: 1, middle: 2, sub: 3 });
    expect(parseAddress("1-2-3")).toBeNull();
  });

  it("decodes integer group addresses", () => {
    expect(decodeGaIntToTriple(2049)).toBe("1/0/1");
    expect(decodeGaIntToTriple(65535)).toBe("31/7/255");
  });

  it("normalizes DPT values to dot notation", () => {
    expect(normalizeDptToDot("9.001")).toBe("9.001");
    expect(normalizeDptToDot("dpst-9-1")).toBe("9.001");
    expect(normalizeDptToDot("5"))
      .toBe("5");
    expect(normalizeDptToDot(undefined))
      .toBeUndefined();
    expect(normalizeDptToDot("abc")).toBeUndefined();
  });

  it("normalizes DPT values to hyphen notation", () => {
    expect(normalizeDptToHyphen("9.001")).toBe("9-1");
    expect(normalizeDptToHyphen("DPST-9-1")).toBe("9-1");
    expect(normalizeDptToHyphen("9"))
      .toBe("9");
    expect(normalizeDptToHyphen(undefined)).toBeNull();
    expect(normalizeDptToHyphen("invalid")).toBeNull();
  });

  it("caches DPT normalization results", () => {
    const first = normalizeDptToDot("7.001");
    const second = normalizeDptToDot("7.001");
    expect(second).toBe(first);
    const hyphenFirst = normalizeDptToHyphen("7.001");
    const hyphenSecond = normalizeDptToHyphen("7.001");
    expect(hyphenSecond).toBe(hyphenFirst);
  });

  it("prunes DPT caches when limits are exceeded", () => {
    for (let i = 0; i < 1100; i++) {
      const main = 20 + (i % 10);
      const sub = i % 256;
      normalizeDptToDot(`${main}.${sub}`);
      normalizeDptToHyphen(`${main}.${sub}`);
    }
    expect(normalizeDptToDot("21.5")).toBe("21.005");
    expect(normalizeDptToHyphen("21.5")).toBe("21-5");
  });
});
