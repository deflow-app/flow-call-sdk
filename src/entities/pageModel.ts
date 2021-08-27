import { Token } from "aggregator-sdk";
import {CallFuncParamType, VariableType, TokenApprovalResState} from "../core";
import { TriggerType, ExternalCallInfo, CallType} from "./contractModel";
import { ChainId } from "../core/constant";
import { BigNumberish } from "ethers";

export interface CronJob{
    key:string,
    name:string,
    cron:string,
    scheduler:TaskRunnerConf[],
    chainId:ChainId
}

export interface TaskRunnerConf{
    taskRunnerKeys:{key:string, seq:number}[], 
    seq:number,
    isParalelle:boolean, 
    exitOnError: boolean
}

export enum InputWhenRunType{
    call=0,
    setVariableOperation=1
}

export interface InputWhenRun{
    inputWhenRunType:InputWhenRunType,
    callId:string,
    callFuncParamName:string,
    setVariableOperationId:string,
    type:string,
    value:any
}

export interface TaskRunner{
    key:string,
    name:string,
    contractKey:string,
    // externalVars:{[key:string]:any}[],
    inputsWhenRun?:InputWhenRun[],
    safeMode?:boolean
}

export interface SuperContract{
    calls:SuperCall[];
    variables:SuperContractVariable[];
    setVariableOperations:SetVariableOperation[];
    chainId:ChainId;
    approveTokens?:Token[];
}

export enum SubType{
    normal=0,
    sendETH=1
}

export interface SuperCall{
    callType:CallType;
    subType?:SubType;
    id:string;
    name:string;
    seq:number;
    callCondition?:string;
    contractAddr?:string;
    contractName?:string;
    abiInfo?:any;
    callFunc?:CallFunc;
    sendEthValue?:BigNumberish;
    tokenAmount?:BigNumberish|string;
    tokenDecimals?:number;
    tokenSymbol?:string;
}

export interface CallFunc{
    name:string;
    params:CallFuncParam[];
    returnValuesCount:number;
}

export interface CallFuncParam{
    name:string;
    type:CallFuncParamType;
    value:any;
    contractName?:string;
    tokenSymbol?:string;
}

export interface SetVariableOperation{
    id:string;
    triggerId:string;
    type:TriggerType;
    valueExp:string;
    variableCodeToSet:string;
}

export interface SuperContractVariable{
    code:string,
    name:string,
    type:VariableType
}

export interface TransactionReceiptEvent{
    address: string,
    args: Array<any>,
    blockHash: string,
    blockNumber: number,
    data: string,
    event: string,
    eventSignature: string,
    logIndex: number,
    topics: Array<string>,
    transactionHash: string,
    transactionIndex: number
}

export interface TransactionEventInfo{
    event:string,
    eventSignature:string,
    args:Array<any>,
    externalCall?:ExternalCallInfo
}

export interface TokenApproval{
    chainId:ChainId,
    approvalList?:Array<TokenApprovalItem>
}

export type TokenApprovalItem = {
    chainId:ChainId,
    tokenAddr:string,
    amount:BigNumberish
}

export type TokenApprovalRes = {
    tokenAddr:string,
    state:TokenApprovalResState,
    tokenDecimal:number
}