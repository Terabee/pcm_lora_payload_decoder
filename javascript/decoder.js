function isKthBitSet(byte, k) {
  return byte & (1 << k);
}

function uint16(bytes) {
  if (bytes.length !== uint16.BYTES) {
    throw new Error('uint16 must have exactly 2 bytes');
  }

  var integer = 0;
  for (var x = 0; x < bytes.length; x++) {
    integer += integer*255 + bytes[x]
  }
  return integer;
};
uint16.BYTES = 2;

function uint32(bytes) {
  if (bytes.length !== uint32.BYTES) {
    throw new Error('uint32 must have exactly 4 bytes');
  }

  var integer = 0;
  for (var x = 0; x < bytes.length; x++) {
    integer += integer*255 + bytes[x]
  }
  return integer;
};
uint32.BYTES = 4;

function decodeFlags(flagByte) {
  var flags = new Object()

  if (isKthBitSet(flagByte, 0))
    flags.TPC_STOPPED = 1

  if (isKthBitSet(flagByte, 1))
    flags.TPC_STUCK = 1

  if (isKthBitSet(flagByte, 2))
    flags.NETWORK_ON = 1

  return flags
}

function parseCounts(payload){
  data = {
    count_in: uint32(payload.slice(0, 4)),
    count_out: uint32(payload.slice(4, 8))
  }
  return data
}

function parseMountingHeight(payload){
  data = {
    mounting_height: uint16(payload.slice(0, 2))
  }
  return data
}

function parsePushPeriod(payload){
  data = {
    push_period_min: uint16(payload.slice(0, 2))
  }
  return data
}

function parseCountDirection(payload){
  data = {
    direction: (payload.slice(0) == 1 ? "IN" : "OUT")
  }
  return data
}

function parseCablePosition(payload){
  data = {
    cable_position: (payload.slice(0) == 1 ? "LEFT" : "RIGHT")
  }
  return data
}

function parseAccessPointState(payload){
  data = {
    state: (payload.slice(0) == 1 ? "ENABLED" : "DISABLED")
  }
  return data
}

function parseSoftwareVersion(payload){
  data = {
    software_version: String.fromCharCode(...payload.slice(1, 11)).slice(0, -1)
  }
  return data
}

function parseHeader(bytes) {
  header = {}

  if (bytes[0] === 255){
    header.cmd_id = bytes[1]
    header.ack = (bytes[2] === 255 ? false : true)
    header.type = "acknowledge"
  } else {
    header.cmd_id = bytes[0]
    header.ack = true
    header.type = "response"
  }

  return header
}

const commands = new Map()

function registerCommand(
  registred_commands_map,
  fport, command_name, cmd_id,
  parsePayload = undefined
) {

  if (fport < 1 || fport > 223) {
    throw "fport must be between 1 and 255"
  }

  if (cmd_id < 0 || cmd_id > 254){
    throw "cmd_id must be between 0 and 254"
  }

  fport_hex = fport.toString(16).padStart(2, '0');
  cmd_id_hex = cmd_id.toString(16).padStart(2, '0');

  key = fport_hex + cmd_id_hex

  registred_commands_map.set(key, {
    command_name: command_name,
    parsePayload: parsePayload
  })
}

function getCommand(
  registred_commands_map, fport, cmd_id
) {
  fport_hex = fport.toString(16).padStart(2, '0');
  cmd_id_hex = cmd_id.toString(16).padStart(2, '0');

  key = fport_hex + cmd_id_hex
  command = registred_commands_map.get(key)

  if (!command){
    throw "command not registered"
  }

  return command
}




/* The Things Network Payload Decoder
  Converts raw bytes to ouptut object

 * input object
 *   {
 *     "bytes": [1, 2, 3], // FRMPayload as byte array
 *     "fPort": 1 // LoRaWAN FPort
 *   }
 *  output object
 *    {
 *      "data": { ... }, // JSON object
 *      "warnings": ["warning 1", "warning 2"], // Optional warnings
 *      "errors": ["error 1", "error 2"] // Optional errors
 *    }
 *
*/

/* HANDLERS BY FPORT

*
*
*

*/

/* UPLINKS WITH CUSTOM FRAME STRUCTURE */
COUNTING_DATA_UPLINK = 1
/* UPLINKS WITH CUSTOM FRAME STRUCTURE END */


F_PORT_COUNTS = 2
/* HANDLER GROUP COUNTS COMMANDS */
registerCommand(commands, F_PORT_COUNTS, "CMD_CNT_RST", 1)
registerCommand(commands, F_PORT_COUNTS, "CMD_CNT_GET", 2,
  parsePayload = parseCounts
)
registerCommand(commands, F_PORT_COUNTS, "CMD_CNT_SET", 130)
/* HANDLER GROUP COUNTS END */

F_PORT_REBOOT = 3
/* HANDLER GROUP REBOOT COMMANDS */
registerCommand(commands, F_PORT_REBOOT, "CMD_DEV_RBT", 1)
registerCommand(commands, F_PORT_REBOOT, "CMD_TPC_RST", 2)
/* HANDLER GROUP REBOOT END */

F_PORT_GET_SOFTWARE_VERSION = 4
/* HANDLER GROUP GET SOFTWARE VERSION COMMANDS */
registerCommand(commands, F_PORT_GET_SOFTWARE_VERSION, "CMD_GET_SW_VER", 1,
  parsePayload = parseSoftwareVersion
)
/* HANDLER GROUP GET SOFTWARE VERSION END */

F_PORT_ACCESS_POINT = 5
/* HANDLER GROUP ACCESS POINT COMMANDS */
registerCommand(commands, F_PORT_ACCESS_POINT, "CMD_GET_AP_STATE", 1,
  parsePayload = parseAccessPointState
)
registerCommand(commands, F_PORT_ACCESS_POINT, "CMD_SET_AP_STATE", 129)
/* HANDLER GROUP ACCESS POINT END */

F_PORT_REJOIN = 6
/* HANDLER GROUP REJOIN COMMANDS */
registerCommand(commands, F_PORT_REJOIN, "CMD_FORCE_REJOIN", 1)
/* HANDLER GROUP REJOIN END */

F_PORT_COUNTING_PARAM = 7
/* HANDLER GROUP COUNTING PARAMETERS COMMANDS */
registerCommand(commands, F_PORT_COUNTING_PARAM, "CMD_SET_HEIGHT", 129)
registerCommand(commands, F_PORT_COUNTING_PARAM, "CMD_GET_HEIGHT", 1,
  parsePayload = parseMountingHeight
)

registerCommand(commands, F_PORT_COUNTING_PARAM, "CMD_SET_COUNTING_DIRECTION", 130)
registerCommand(commands, F_PORT_COUNTING_PARAM, "CMD_GET_COUNTING_DIRECTION", 2,
  parsePayload = parseCountDirection
)
registerCommand(commands, F_PORT_COUNTING_PARAM, "CMD_SET_PUSH_PERIOD", 131)
registerCommand(commands, F_PORT_COUNTING_PARAM, "CMD_GET_PUSH_PERIOD", 3,
  parsePayload = parsePushPeriod
)
registerCommand(commands, F_PORT_COUNTING_PARAM, "CMD_SET_CABLE_CONNECTION", 132)
registerCommand(commands, F_PORT_COUNTING_PARAM, "CMD_GET_CABLE_CONNECTION", 4,
  parsePayload = parseCablePosition
)
/* HANDLER GROUP COUNTING PARAMETERS END */

function decodeUplink(input) {

  var data = new Object()

  var fport = input.fPort

  if (fport === COUNTING_DATA_UPLINK){
    data.count_in = uint32(input.bytes.slice(0, 4))
    data.count_out = uint32(input.bytes.slice(4, 8))
    data.flags = decodeFlags(input.bytes[8])

    return {
      data
    };
  }

  var header = parseHeader(input.bytes)

  var command
  try {
    command = getCommand(commands, fport, header.cmd_id)
  } catch (e) {
    return {
      errors: ["unknown command"]
    }
  }

  data.cmd = {
      name: command.command_name,
      id: header.cmd_id,
      success: header.ack
  }

  if (header.type === "response") {
    payload = input.bytes.slice(1)

    data.cmd.value = command.parsePayload(payload)
  }

  return {
    data
  };

}


// Exporting for testing only, don't copy the lines below
// To Network Server Decoder
module.exports = {
  isKthBitSet,
  uint32,
  decodeUplink,
  parseCounts,
  registerCommand,
  getCommand
};

