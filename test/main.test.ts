import {flowCall,ChainId, CHAIN_CONFIG,logger, TriggerType, OpCode, CallType, PARAMETER_ID_FOR_TOKEN_AMOUNT} from "../src";
import flowCallAbi from "../src/core/FlowCall.json";
import {Wallet} from '@ethersproject/wallet';
import {JsonRpcProvider} from "@ethersproject/providers"
import { hexlify, Interface } from "ethers/src.ts/utils";
import erc20 from "./ERC20.json";
import { Contract } from "@ethersproject/contracts";
import { MaxUint256 } from "@ethersproject/constants";
import { parseUnits, formatUnits,parseEther } from '@ethersproject/units'

const fs = require('fs');
const key= fs.readFileSync(".key").toString().trim();
describe('Flow call test', () => {
    it('main', (async () => {
        const chainId=ChainId.HECOMAINNET;
        const provider=new JsonRpcProvider(CHAIN_CONFIG[chainId].rpcUrl);
        const wallet=new Wallet(key,provider);
        const tokenAddress="0x2ba27d69df06cc8b37ba8d2ff00afbf412e70e16";
        const senderAddress="0x0A8548Bf245c01eCDD95a2052B5f176888f14FaA";
        const flowCallAddress=CHAIN_CONFIG[chainId].contractAddress;
        const tokenContract=new Contract(tokenAddress,erc20,wallet);

        // const tx=await tokenContract.approve(CHAIN_CONFIG[chainId].tokenReceiver,MaxUint256);
        // await tx.wait();
        // logger.info("Approve successful!!!");

        const inter=new Interface(erc20);
        const callData=inter.encodeFunctionData("balanceOf",[senderAddress]);
        logger.info("call data: "+callData);
        const call1={
            callType:CallType.callContract,
            targetContract:tokenAddress,
            callData:callData,
            sendEthValue:0,
            seq:0,
            variableParameters:[],
            returnValuesCount:1,
            callCondition:[],
            tokenAmount:0
        };

        // const callData2=inter.encodeFunctionData("transferFrom",[senderAddress,flowCallAddress,0]);
        // logger.info("call data2: "+callData2);
        // const call2={
        //     callType:CallType.callContract,
        //     targetContract:tokenAddress,
        //     callData:callData2,
        //     sendEthValue:0,
        //     seq:1,
        //     variableParameters:[
        //         {
        //             parameterId:2,
        //             variableId:0
        //         }
        //     ],
        //     returnValuesCount:0,
        //     callCondition:[OpCode.OPCODE_EQ,OpCode.OPCODE_CONST,1,OpCode.OPCODE_CONST,1]
        // };

        const call2={
            callType:CallType.safeReceive,
            targetContract:tokenAddress,
            tokenAmount:0,
            seq:1,
            callCondition:[],
            callData:"0x000000",
            sendEthValue:0,
            variableParameters:[
                {
                    parameterId:PARAMETER_ID_FOR_TOKEN_AMOUNT,
                    variableId:0
                }
            ],
            returnValuesCount:0,
        };

        const callData3=inter.encodeFunctionData("transfer",[senderAddress,0]);
        logger.info("call data3: "+callData3);
        const call3={
            callType:CallType.callContract,
            targetContract:tokenAddress,
            callData:callData3,
            sendEthValue:0,
            seq:2,
            variableParameters:[
                {
                    parameterId:1,
                    variableId:1
                }
            ],
            returnValuesCount:0,
            callCondition:[OpCode.OPCODE_EQ,OpCode.OPCODE_CONST,1,OpCode.OPCODE_CONST,1],
            tokenAmount:0
        };
        const eth=parseEther("0.00001");
        console.log(eth);
        const call4={
            callType:CallType.callContract,
            targetContract:senderAddress,
            callData:"0x00000000",
            sendEthValue:eth,
            seq:3,
            variableParameters:[
            ],
            returnValuesCount:0,
            callCondition:[],
            tokenAmount:0
        };

        const op0={
            variableIdToSet:0,
            triggerType:TriggerType.afterCall,
            triggerId:0,
            valueExpression:[OpCode.OPCODE_VAR,0]
        };
        const op1={
            variableIdToSet:0,
            triggerType:TriggerType.afterCall,
            triggerId:0,
            valueExpression:[OpCode.OPCODE_DIV,OpCode.OPCODE_VAR,0,OpCode.OPCODE_CONST,2]
        };

        const op2={
            variableIdToSet:1,
            triggerType:TriggerType.afterSetVariableOperation,
            triggerId:0,
            valueExpression:[OpCode.OPCODE_VAR,0]
        }

        // const flowCallInterface=new Interface(flowCallAbi);
        // const finalCallData=flowCallInterface.encodeFunctionData("flowCall",[[call1,call2,call3],1,[op1]]);
        // console.log(finalCallData);
       
        
        const rpt=await flowCall([call1,call2,call3,call4],2,[op1,op2],wallet,chainId,eth);
    }),300000);

    it('main', (async () => {
        let ve = "{test1}=100 if 1==1 else {test2}=50";
        let test_arr:{[key:string]:number} = {"test1":0, "test2":1};
        if(/\{\w+\}/.test(ve)){
            let vars:Array<string>|null = ve.match(/\{\w+\}/gi);
            if(vars != null){
                for(let i = 0; i < vars.length; i ++){
                    console.log(vars[i].toString());
                    let varId = test_arr[vars[i].substring(1, vars[i].lastIndexOf("}"))];
                    console.log(varId);
                    ve = ve.replace(vars[i].toString(), "{"+varId+"}");
                }
            }
        }

        console.log(ve);
    }), 300000);
});