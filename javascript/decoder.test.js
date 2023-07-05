const { expect, test } = require("@jest/globals");
const {
  isKthBitSet,
  uint32,
  decodeUplink
} = require('./decoder');

test('test passes', () => {
  expect(true).toBeTruthy();
})

test('should check if the bit  0 is set', () => {
    byte = parseInt('00000001', 2);
    expect(isKthBitSet(byte, 0)).toBeTruthy();
});

test('should check if bit 0 is not set', () => {
  byte = parseInt('00000000', 2);
  expect(isKthBitSet(byte, 0)).toBeFalsy();
});

test('should check if all bits are set', () => {
  bit_0_set = parseInt('00000001', 2);
  bit_1_set = parseInt('00000010', 2);
  bit_2_set = parseInt('00000100', 2);
  bit_3_set = parseInt('00001000', 2);
  bit_4_set = parseInt('00010000', 2);
  bit_5_set = parseInt('00100000', 2);
  bit_6_set = parseInt('01000000', 2);
  bit_7_set = parseInt('10000000', 2);

  expect(isKthBitSet(bit_0_set, 0)).toBeTruthy();
  expect(isKthBitSet(bit_1_set, 1)).toBeTruthy();
  expect(isKthBitSet(bit_2_set, 2)).toBeTruthy();
  expect(isKthBitSet(bit_3_set, 3)).toBeTruthy();
  expect(isKthBitSet(bit_4_set, 4)).toBeTruthy();
  expect(isKthBitSet(bit_5_set, 5)).toBeTruthy();
  expect(isKthBitSet(bit_6_set, 6)).toBeTruthy();
  expect(isKthBitSet(bit_7_set, 7)).toBeTruthy();
});

test('should check if all bits are not set', () => {
  bit_0_set = parseInt('00000000', 2);
  bit_1_set = parseInt('00000000', 2);
  bit_2_set = parseInt('00000000', 2);
  bit_3_set = parseInt('00000000', 2);
  bit_4_set = parseInt('00000000', 2);
  bit_5_set = parseInt('00000000', 2);
  bit_6_set = parseInt('00000000', 2);
  bit_7_set = parseInt('00000000', 2);

  expect(isKthBitSet(bit_0_set, 0)).toBeFalsy();
  expect(isKthBitSet(bit_1_set, 1)).toBeFalsy();
  expect(isKthBitSet(bit_2_set, 2)).toBeFalsy();
  expect(isKthBitSet(bit_3_set, 3)).toBeFalsy();
  expect(isKthBitSet(bit_4_set, 4)).toBeFalsy();
  expect(isKthBitSet(bit_5_set, 5)).toBeFalsy();
  expect(isKthBitSet(bit_6_set, 6)).toBeFalsy();
  expect(isKthBitSet(bit_7_set, 7)).toBeFalsy();
});

describe('uint32', () => {
  it("should convert arbitrary uint32", () => {
    expect(uint32([0, 0, 1, 200])).toBe(456)
  })

  it("should convert max uint32 ", () => {
    expect(uint32([255, 255, 255, 255])).toBe(4294967295)
  })

  it("should convert min uint32 ", () => {
    expect(uint32([0, 0, 0, 0])).toBe(0)
  })

  it("should fail with too many bytes error", () => {
    expect(() => uint32([0, 2, 2, 4 ,5])).toThrow('uint32 must have exactly 4 bytes')
  })

  it("should fail with too little bytes error", () => {
    expect(() => uint32([0, 2, 2])).toThrow('uint32 must have exactly 4 bytes')
  })
})

describe('decodeUplink', () => {
  it('should return error unknown command', () => {
    const input = {
      fPort: 255,
      bytes: [1, 2, 3, 4, 5]
    }
    expect(decodeUplink(input))
      .toStrictEqual({"errors": ["unknown command"]})
  })

  it('should return correct uplink frame', () => {
    const input = {
      fPort: 1,
      bytes: [0, 0, 0, 200, 0, 0, 1, 200, 0]
    }
    expect(decodeUplink(input))
      .toMatchObject({data:
        {
          count_in: 200,
          count_out: 456
        }
      })
  })

  it('should return TPC_STOPPED flag', () => {
    const input = {
      fPort: 1,
      bytes: [0, 0, 0, 0, 0, 0, 0, 0, 1]
    }
    expect(decodeUplink(input))
      .toMatchObject({data:
        {
          flags: {
            TPC_STOPPED: 1
          }
        }
      }
    )
  })

  it('should return TPC_STUCK flag', () => {
    const input = {
      fPort: 1,
      bytes: [0, 0, 0, 0, 0, 0, 0, 0, 2]
    }
    expect(decodeUplink(input))
      .toMatchObject({data:
        {
          flags: {
            TPC_STUCK: 1
          }
        }
      }
    )
  })

  it('should return NETWORK_ON flag', () => {
    const input = {
      fPort: 1,
      bytes: [0, 0, 0, 0, 0, 0, 0, 0, 4]
    }
    expect(decodeUplink(input))
      .toMatchObject({data:
        {
          flags: {
            NETWORK_ON: 1
          }
        }
      }
    )
  })


  it(`should return, NETWORK_ON
    TPC_STUCK, TPC_STOPPED flags`, () => {
    const input = {
      fPort: 1,
      bytes: [0, 0, 0, 0, 0, 0, 0, 0, 15]
    }
    expect(decodeUplink(input))
      .toMatchObject({data:
        {
          flags: {
            TPC_STOPPED: 1,
            TPC_STUCK: 1,
            NETWORK_ON: 1
          }
        }
      }
    )
  })
})

