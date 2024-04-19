const { expect, test } = require("@jest/globals");
const {
  isKthBitSet,
  uint32,
  decodeUplink,
  registerCommand,
  getCommand,
  parseCounts
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

describe('registerCommand', () => {
  it("should register command", () => {
    const registered_commands_map = new Map()

    const fport = 2
    registerCommand(registered_commands_map, fport, "CMD_CNT_RST", 1)

    expect(registered_commands_map.get("0201")).toMatchObject({
      command_name: "CMD_CNT_RST"
    })

    registerCommand(registered_commands_map, fport, "CMD_CNT_SET", 130)

    expect(registered_commands_map.get("0282")).toMatchObject({
      command_name: "CMD_CNT_SET"
    })
  })

  it("should fail with fport out of bounds", () => {
    const registered_commands_map = new Map()

    const fport = 256
    expect(() => registerCommand(
      registered_commands_map, fport, "CMD_ID_FOO", 200
      ).toThrow("fport must be between 1 and 255")
    )
  })

  it("should fail with cmd_id out of bounds", () => {
    const registered_commands_map = new Map()

    const fport = 30
    expect(() => registerCommand(fport, "CMD_ID_WRONG", 255
      ).toThrow("cmd_id must be between 0 and 254")
    )
  })

  it("should get handler name and command name", () => {
    const registered_commands_map = new Map()

    const fport = 2
    registerCommand(registered_commands_map, fport, "CMD_CNT_RST", 1)

    expect(getCommand(registered_commands_map, 2 , 1)).toMatchObject({
      command_name: "CMD_CNT_RST"
    })
  })

  it("should fail with command not registered", () => {
    const registered_commands_map = new Map()

    expect(() => getCommand(registered_commands_map, 10, 10)).toThrow("command not registered")
  })

  it("should execute the foo command payload parser", () => {
    const registered_commands_map = new Map()

    const fooParser = function(payload) {
      return payload
    }
    const fport = 99
    registerCommand(registered_commands_map, fport, "CMD_FOO", 99, parsePayload = fooParser)

    command = getCommand(registered_commands_map, 99, 99)
    expect(command.parsePayload([255, 255])).toStrictEqual([255, 255])
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
      fPort: 82,
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
      fPort: 82,
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
      fPort: 82,
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
      fPort: 82,
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
      fPort: 82,
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

  it('should handle CMD_CNT_GET command', () => {

    const fport = 2

    const input = {
      fPort: fport,
      bytes: [2, 0, 0, 0, 200, 0, 0, 1, 200]
    }

    expect(decodeUplink(input))
    .toMatchObject({data: {
      cmd: {
        name: "CMD_CNT_GET",
        id: 2,
        success: true,
        value: {
          count_in: 200,
          count_out: 456
        }
      }
    }

    })
  })


  it('should handle CMD_GET_ACCESS_POINT_STATE command', () => {
    const registered_commands_map = new Map()

    const fport = 5

    let input = {
      fPort: fport,
      bytes: [1, 0]
    }

    expect(decodeUplink(input))
    .toMatchObject({data: {
      cmd: {
        name: "CMD_GET_ACCESS_POINT_STATE",
        id: 1,
        success: true,
        value: {
          state: "DISABLED"
        }
      }
    }})

    input = {
      fPort: fport,
      bytes: [1, 1]
    }

    expect(decodeUplink(input))
    .toMatchObject({data: {
      cmd: {
        name: "CMD_GET_ACCESS_POINT_STATE",
        id: 1,
        success: true,
        value: {
          state: "ENABLED"
        }
      }
    }})
  })

  describe("software version", () => {
    it('should handle CMD_GET_SW_VER command', () => {

      const fport = 4

      const input = {
        fPort: fport,
        bytes: [138, 0, 118, 48, 46, 57, 46, 50, 45, 69, 85, 0]
      }

      expect(decodeUplink(input))
      .toMatchObject({data: {
        cmd: {
          name: "CMD_GET_SW_VER",
          id: 138,
          success: true,
          value: {
            software_version: "v0.9.2-EU"
          }
        }
      }})
    })

    it('should handle CMD_GET_DEVICE_TYPE POC', () => {

      const fport = 4

      const input = {
        fPort: fport,
        bytes: [128, 80, 79, 67]
      }

      expect(decodeUplink(input))
      .toMatchObject({data: {
        cmd: {
          name: "CMD_GET_DEVICE_TYPE",
          id: 128,
          success: true,
          value: {
            device_type: "POC"
          }
        }
      }})
    })

    it('should handle CMD_GET_DEVICE_TYPE PCM', () => {

      const fport = 4

      const input = {
        fPort: fport,
        bytes: [128, 80, 67, 77]
      }

      expect(decodeUplink(input))
      .toMatchObject({data: {
        cmd: {
          name: "CMD_GET_DEVICE_TYPE",
          id: 128,
          success: true,
          value: {
            device_type: "PCM"
          }
        }
      }})
    })

    it('should handle CMD_GET_DEVICE_TYPE not recognized', () => {

      const fport = 4

      const input = {
        fPort: fport,
        bytes: [128, 88, 88, 88]
      }

      expect(decodeUplink(input))
      .toMatchObject({data: {
        cmd: {
          name: "CMD_GET_DEVICE_TYPE",
          id: 128,
          success: true,
          value: {
            device_type: "not recognized"
          }
        }
      }})
    })

    it('should handle CMD_GET_LORA_MODULE_VERSION', () => {

      const fport = 4

      const input = {
        fPort: fport,
        bytes: [139, 82, 85, 73, 95, 52, 46, 48, 46, 50]
      }

      expect(decodeUplink(input))
      .toMatchObject({data: {
        cmd: {
          name: "CMD_GET_LORA_MODULE_VERSION",
          id: 139,
          success: true,
          value: {
            lora_module_version: "RUI_4.0.2"
          }
        }
      }})
    })

    it('should handle CMD_GET_LORA_MODULE_VERSION failed to retrieve module version', () => {

      const fport = 4

      const input = {
        fPort: fport,
        bytes: [139, 255, 255, 255]
      }

      expect(decodeUplink(input))
      .toMatchObject({data: {
        cmd: {
          name: "CMD_GET_LORA_MODULE_VERSION",
          id: 139,
          success: true,
          value: {
            lora_module_version: "failure to retrieve"
          }
        }
      }})
    })

  })

  it('should handle CMD_GET_HEIGHT command', () => {
    const registered_commands_map = new Map()

    const fport = 100

    const input = {
      fPort: fport,
      bytes: [1, 5, 220]
    }

    expect(decodeUplink(input))
    .toMatchObject({data: {
      cmd: {
        name: "CMD_GET_HEIGHT",
        id: 1,
        success: true,
        value: {
          mounting_height: 1500
        }
      }
    }})
  })

  it('should handle CMD_GET_COUNTING_DIRECTION command', () => {
    const registered_commands_map = new Map()

    const fport = 100

    let input = {
      fPort: fport,
      bytes: [2, 1]
    }

    expect(decodeUplink(input))
    .toMatchObject({data: {
      cmd: {
        name: "CMD_GET_COUNTING_DIRECTION",
        id: 2,
        success: true,
        value: {
          direction: "IN"
        }
      }
    }})

    input = {
      fPort: fport,
      bytes: [2, 0]
    }

    expect(decodeUplink(input))
    .toMatchObject({data: {
      cmd: {
        name: "CMD_GET_COUNTING_DIRECTION",
        id: 2,
        success: true,
        value: {
          direction: "OUT"
        }
      }
    }})
  })


  it('should handle CMD_GET_PUSH_PERIOD command', () => {
    const registered_commands_map = new Map()

    const fport = 100

    const input = {
      fPort: fport,
      bytes: [3, 0, 0, 0, 60]
    }

    expect(decodeUplink(input))
    .toMatchObject({data: {
      cmd: {
        name: "CMD_GET_PUSH_PERIOD",
        id: 3,
        success: true,
        value: {
          push_period_s: 60
        }
      }
    }})
  })

  it('should handle CMD_GET_CABLE_CONNECTION command', () => {
    const registered_commands_map = new Map()

    const fport = 100

    let input = {
      fPort: fport,
      bytes: [4, 1]
    }

    expect(decodeUplink(input))
    .toMatchObject({data: {
      cmd: {
        name: "CMD_GET_CABLE_CONNECTION",
        id: 4,
        success: true,
        value: {
          cable_position: "LEFT"
        }
      }
    }})

    input = {
      fPort: fport,
      bytes: [4, 0]
    }

    expect(decodeUplink(input))
    .toMatchObject({data: {
      cmd: {
        name: "CMD_GET_CABLE_CONNECTION",
        id: 4,
        success: true,
        value: {
          cable_position: "RIGHT"
        }
      }
    }})

  })

  it('should handle CMD_GET_ANALOG_OUTPUT command', () => {
    const fport = 8

    let input = {
      fPort: fport,
      bytes: [1, 0, 0, 255]
    }

    expect(decodeUplink(input))
    .toMatchObject({data: {
      cmd: {
        name: "CMD_GET_ANALOG_OUTPUT",
        id: 1,
        success: true,
        value: {
          max_occupancy: 255,
          state: "DISABLED"
        }
      }
    }})

    input = {
      fPort: fport,
      bytes: [1, 0, 255, 255]
    }

    expect(decodeUplink(input))
    .toMatchObject({data: {
      cmd: {
        name: "CMD_GET_ANALOG_OUTPUT",
        id: 1,
        success: true,
        value: {
          max_occupancy: 65535,
          state: "DISABLED"
        }
      }
    }})

    input = {
      fPort: fport,
      bytes: [1, 1, 0, 0]
    }

    expect(decodeUplink(input))
    .toMatchObject({data: {
      cmd: {
        name: "CMD_GET_ANALOG_OUTPUT",
        id: 1,
        success: true,
        value: {
          max_occupancy: 0,
          state: "ENABLED"
        }
      }
    }})
  })

  it('should handle CMD_SET_ANALOG_OUTPUT command', () => {

    const fport = 8

    let input = {
      fPort: fport,
      bytes: [255, 129, 0]
    }

    expect(decodeUplink(input))
      .toMatchObject({
        data: {
          cmd: {
            name: "CMD_SET_ANALOG_OUTPUT",
            id: 129,
            success: true
          }
        }
      })
  })

})

