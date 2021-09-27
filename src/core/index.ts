import { CallInfo, SetVariableOpr as SetVariableOperation } from "../entities/contractModel";
import { JsonRpcProvider, Provider } from "@ethersproject/providers"
import { BigNumberish, BigNumber } from "@ethersproject/bignumber"
import { ChainId, CHAIN_CONFIG } from "./constant";
import { Contract, Signer } from "ethers";
import { logger } from "../logger";
import abi from "./FlowCall.json";
import flowCallHelperAbi from "./FlowCallHelper.json";

export * from "./constant";

export function getFlowCallABI(){
    return abi;
}

export function getFlowCallHelperABI(){
    return flowCallHelperAbi;
}

export async function flowCall(callList: CallInfo[], variableCount: number, setVariableOperationList: SetVariableOperation[],
    wallet: Signer | Provider, chainId: ChainId = ChainId.BSCMAINNET, sendEthValue:BigNumberish = 0): Promise<any> {
    // const provider=new JsonRpcProvider(CHAIN_CONFIG[chainId].rpcUrl);
    logger.info("Start a flow call...");
    const contract = new Contract(CHAIN_CONFIG[chainId].contractAddress, abi, wallet);
    try{
        let estiGas:BigNumber = await contract.estimateGas.flowCall(callList, variableCount, setVariableOperationList,{value:sendEthValue});
        const tx = await contract.flowCall(callList, variableCount, setVariableOperationList,{value:sendEthValue, gasLimit:estiGas.add(estiGas.div(10))});
        const rpt = await tx.wait();
        logger.info("Flow call successful!!!");
        return rpt;
    }
    catch(e){
        await contract.callStatic.flowCall(callList, variableCount, setVariableOperationList,{value:sendEthValue});
        throw e;
    }
    
    
}

export async function flowCallSafe(callList: CallInfo[], variableCount: number, setVariableOperationList: SetVariableOperation[],
    wallet: Signer | Provider, chainId: ChainId = ChainId.BSCMAINNET, sendEthValue:BigNumberish = 0, approvedTokens:string[]): Promise<any> {
    // const provider=new JsonRpcProvider(CHAIN_CONFIG[chainId].rpcUrl);
    logger.info("Start a safe flow call...");
    const contract = new Contract(CHAIN_CONFIG[chainId].contractAddress, abi, wallet);
    try{
        let estiGas:BigNumber = await contract.estimateGas.flowCallSafe(callList, variableCount, setVariableOperationList,approvedTokens,{value:sendEthValue});
        const tx = await contract.flowCallSafe(callList, variableCount, setVariableOperationList,approvedTokens,{value:sendEthValue, gasLimit:estiGas.add(estiGas.div(10))});
        const rpt = await tx.wait();
        logger.info("Flow call successful!!!");
        return rpt;
    }
    catch(e){
        await contract.callStatic.flowCallSafe(callList, variableCount, setVariableOperationList,approvedTokens,{value:sendEthValue});
        throw e;
    }
}

export async function javascriptCall(contractAddr: string, abiInfo: any, funcName:string, paramVals:any[],
    wallet: Signer | Provider, chainId: ChainId = ChainId.BSCMAINNET, sendEthValue:BigNumberish = 0): Promise<any> {
    logger.info("Start a JS call...", "contractAddr", contractAddr, "funcName", funcName, "paramVals", paramVals, "sendEthValue", sendEthValue);
    try{
        const contract = new Contract(contractAddr, abiInfo, wallet);
        let func = abiInfo.find(item=>item.type==='function' && item.name===funcName);
        let tx = null;
        let rpt = null;
        if(func?.stateMutability!=='view'){
            let estiGas:BigNumber = await contract.estimateGas[funcName](...paramVals, {value:sendEthValue});
            tx = await contract.functions[funcName](...paramVals, {value:sendEthValue,  gasLimit:estiGas.add(estiGas.div(10))});
            rpt = await tx.wait();
        }else{
            tx = await contract.functions[funcName](...paramVals, {value:sendEthValue});
            rpt = tx;
        }
        logger.info("JS call successful!!!");
        console.log("js call rpt:", rpt);
        return rpt;
    }
    catch(e){
        console.error(e);
        throw e;
    }
}