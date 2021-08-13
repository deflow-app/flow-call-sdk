export enum ChainId {
    BSCMAINNET = 56,
    BSCTESTNET = 97,
    HECOMAINNET = 128
  }

export const CHAIN_CONFIG={
    [ChainId.BSCTESTNET]:{
        rpcUrl:"https://data-seed-prebsc-2-s1.binance.org:8545",
        contractAddress:"0x456b82F1357754247e4de4106AdDe29F7d04E82c",
        tokenReceiver:"0x4f81FE1c01C459b499753F2A9b7C68E29612FF42"
    },
    [ChainId.BSCMAINNET]:{
        rpcUrl:"https://bsc-dataseed4.ninicoin.io",
        contractAddress:"",
        tokenReceiver:""
    },
    [ChainId.HECOMAINNET]:{
        rpcUrl:"https://http-mainnet.hecochain.com",
        contractAddress:"0x06f1cae52A4032A8b3dbEebF9Fcc5D0b6d2B5fF0",
        tokenReceiver:"0xBFD8Bc2B2ED16FC86C8a7F23F66768ae9D10B707"
    }
};

export const PARAMETER_ID_FOR_TARGET_CONTRACT = 9999999999;
export const PARAMETER_ID_FOR_SEND_ETH_VALUE = 9999999998;
export const PARAMETER_ID_FOR_TOKEN_AMOUNT = 9999999997;

  /// +--------+----------------------------------------+------+------------+
  /// | Opcode |              Description               | i.e. | # children |
  /// +--------+----------------------------------------+------+------------+
  /// |   00   | Integer Constant                       |   c  |      0     |
  /// |   01   | Variable                               |   X  |      0     |
  /// |   02   | Arithmetic Square Root                 |   √  |      1     |
  /// |   03   | Boolean Not Condition                  |   !  |      1     |
  /// |   04   | Arithmetic Addition                    |   +  |      2     |
  /// |   05   | Arithmetic Subtraction                 |   -  |      2     |
  /// |   06   | Arithmetic Multiplication              |   *  |      2     |
  /// |   07   | Arithmetic Division                    |   /  |      2     |
  /// |   08   | Arithmetic Exponentiation              |  **  |      2     |
  /// |   09   | Arithmetic Percentage* (see below)     |   %  |      2     |
  /// |   10   | Arithmetic Equal Comparison            |  ==  |      2     |
  /// |   11   | Arithmetic Non-Equal Comparison        |  !=  |      2     |
  /// |   12   | Arithmetic Less-Than Comparison        |  <   |      2     |
  /// |   13   | Arithmetic Greater-Than Comparison     |  >   |      2     |
  /// |   14   | Arithmetic Non-Greater-Than Comparison |  <=  |      2     |
  /// |   15   | Arithmetic Non-Less-Than Comparison    |  >=  |      2     |
  /// |   16   | Boolean And Condition                  |  &&  |      2     |
  /// |   17   | Boolean Or Condition                   |  ||  |      2     |
  /// |   18   | Ternary Operation                      |  ?:  |      3     |
  /// |   19   | Bancor's log** (see below)             |      |      3     |
  /// |   20   | Bancor's power*** (see below)          |      |      4     |
  /// +--------+----------------------------------------+------+------------+
export enum OpCode{
    OPCODE_CONST = 0,
    OPCODE_VAR = 1,
    OPCODE_SQRT = 2,
    OPCODE_NOT = 3,
    OPCODE_ADD = 4,
    OPCODE_SUB = 5,
    OPCODE_MUL = 6,
    OPCODE_DIV = 7,
    OPCODE_EXP = 8,
    OPCODE_PCT = 9,
    OPCODE_EQ = 10,
    OPCODE_NE = 11,
    OPCODE_LT = 12,
    OPCODE_GT = 13,
    OPCODE_LE = 14,
    OPCODE_GE = 15,
    OPCODE_AND = 16,
    OPCODE_OR = 17,
    OPCODE_IF = 18,
    OPCODE_BANCOR_LOG = 19,
    OPCODE_BANCOR_POWER = 20,
    OPCODE_INVALID = 21
}

export const OpCodeDict:{[key:string]:OpCode}={
    '√':OpCode.OPCODE_SQRT,
    '!':OpCode.OPCODE_NOT,
    '+':OpCode.OPCODE_ADD,
    '-':OpCode.OPCODE_SUB,
    '*':OpCode.OPCODE_MUL,
    '/':OpCode.OPCODE_DIV,
    '%':OpCode.OPCODE_PCT,
    '^':OpCode.OPCODE_EXP,
    '>':OpCode.OPCODE_GT,
    '<':OpCode.OPCODE_LT,
    '&eq;':OpCode.OPCODE_EQ,
    '&ne;':OpCode.OPCODE_NE,
    '&ge;':OpCode.OPCODE_GE,
    '&le;':OpCode.OPCODE_LE,
    'or':OpCode.OPCODE_OR,
    'and':OpCode.OPCODE_AND
}
