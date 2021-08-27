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
    logger.info("Start a flow call: ", chainId, callList, variableCount, setVariableOperationList);
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
    logger.info("Start a safe flow call: ", chainId, callList, variableCount, setVariableOperationList,approvedTokens);
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