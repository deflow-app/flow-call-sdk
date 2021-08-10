import { CallInfo, SetVariableOperation } from "../entities";
import { JsonRpcProvider, Provider } from "@ethersproject/providers"
import { BigNumberish, BigNumber } from "@ethersproject/bignumber"
import { ChainId, CHAIN_CONFIG } from "./constant";
import { Contract, Signer } from "ethers";
import { logger } from "../logger";
import abi from "./FlowCall.json";

export * from "./constant";

export async function flowCall(callList: CallInfo[], variableCount: number, setVariableOperationList: SetVariableOperation[],
    wallet: Signer | Provider, chainId: ChainId = ChainId.BSCMAINNET, sendEthValue:BigNumberish = 0): Promise<any> {
    // const provider=new JsonRpcProvider(CHAIN_CONFIG[chainId].rpcUrl);
    logger.info("Start a flow call: ", chainId, callList, variableCount, setVariableOperationList);
    const contract = new Contract(CHAIN_CONFIG[chainId].contractAddress, abi, wallet);
    let estiGas:BigNumber = await contract.estimateGas.flowCall(callList, variableCount, setVariableOperationList,{value:sendEthValue});
    await contract.callStatic.flowCall(callList, variableCount, setVariableOperationList,{value:sendEthValue, gasLimit:estiGas.add(estiGas.div(BigNumber.from("10")))});
    const tx = await contract.flowCall(callList, variableCount, setVariableOperationList,{value:sendEthValue, gasLimit:estiGas.add(estiGas.div(BigNumber.from("10")))});
    const rpt = await tx.wait();
    logger.info("Flow call successful!!!");
    return rpt
}