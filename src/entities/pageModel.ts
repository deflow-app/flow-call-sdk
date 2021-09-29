import { CallFuncParamType, VariableType, TokenApprovalResState, PubType, ChainId, Source } from "../core";
import { TriggerType, ExternalCallInfo, CallType } from "./contractModel";
import { BigNumberish } from "ethers";


export interface Token {
    chainId: ChainId, address: string, decimals: number, symbol?: string, name?: string, logoUrl?: string
}

export interface PubObj {
    type: PubType,
    data: SuperContract | CronJob
}

export interface CronJob {
    key: string,
    name: string,
    cron: string,
    scheduler: Array<TaskRunnerConf | JsCallConf | TaskCallConf>,
    chainId: ChainId,
    latestCID?: string,
    src: Source,
    runners?: TaskRunner[],
    tasks?: { key: string, task: SuperContract }[],
    variables:JobVariable[]
}

export interface JobVariable{
    code:string,
    name:string,
    value:any,
    inputWhenRun:boolean
}

export interface SetJobVariable{
    variableCode:string
}

export interface SetJobVariableByEvent extends SetJobVariable{
    eventName:string,
    eventInputName:string
}

export interface SetJobVariableByReturnValue extends SetJobVariable{
    returnValueIndex:number
}

export interface SetJobVariableByTaskVariable extends SetJobVariable{
    taskVariableCode:string
}

export interface TaskRunnerConf {
    taskRunnerKeys: { key: string, seq: number,setVarList:SetJobVariableByTaskVariable[]}[],
    seq: number,
    isParalelle: boolean,
    exitOnError: boolean
}

export interface TaskCallConf {
    seq: number,
    isParalelle: boolean,
    exitOnError: boolean,
    taskCall:TaskCall[]
}

export interface TaskCall{
    key:string,
    name:string,
    callCondition?: string,
    contractKey: string,
    inputsWhenRun?: InputWhenRun[],
    safeMode?: boolean,
    seq: number,
    setVarList:SetJobVariableByTaskVariable[]
}

export interface JsCallConf{
    jsCall:JsCall,
    exitOnError:boolean,
    setVarList:SetJobVariable[],
    seq: number,
}

export interface JsCall {
    id:string,
    name:string,
    callCondition?: string,
    contractAddr: string,
    contractName?: string,
    abiInfo: any,
    callFunc: CallFunc,
    sendEthValue?: BigNumberish,
    chainId?:ChainId
}

export enum InputWhenRunType {
    call = 0,
    setVariableOperation = 1,
    sendEthToFlowCall = 2
}

export interface InputWhenRun {
    inputWhenRunType: InputWhenRunType,
    callId: string,
    callFuncParamName: string,
    setVariableOperationId: string,
    type: string,
    value: any
}

export interface TaskRunner {
    key: string,
    name: string,
    contractKey: string,
    // externalVars:{[key:string]:any}[],
    inputsWhenRun?: InputWhenRun[],
    safeMode?: boolean
}

export interface SuperContract {
    calls: SuperCall[];
    variables: SuperContractVariable[];
    setVariableOperations: SetVariableOperation[];
    chainId: ChainId;
    approveTokens?: Token[];
    latestCID?: string;
}

export enum SubType {
    normal = 0,
    sendETH = 1
}

export interface SuperCall {
    callType: CallType;
    subType?: SubType;
    id: string;
    name: string;
    seq: number;
    callCondition?: string;
    contractAddr?: string;
    contractName?: string;
    abiInfo?: any;
    callFunc?: CallFunc;
    sendEthValue?: BigNumberish;
    tokenAmount?: BigNumberish | string;
    tokenDecimals?: number;
    tokenSymbol?: string;
}

export interface CallFunc {
    name: string;
    params: CallFuncParam[];
    returnValuesCount: number;
}

export interface CallFuncParam {
    name: string;
    type: CallFuncParamType;
    value: any;
    contractName?: string;
    tokenSymbol?: string;
}

export interface SetVariableOperation {
    id: string;
    triggerId: string;
    type: TriggerType;
    valueExp: string;
    variableCodeToSet: string;
}

export interface SuperContractVariable {
    code: string,
    name: string,
    type: VariableType
}

export interface TransactionReceiptEvent {
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

export interface TransactionEventInfo {
    event: string,
    eventSignature: string,
    args: Array<any>,
    externalCall?: ExternalCallInfo
}

export interface TokenApproval {
    chainId: ChainId,
    approvalList?: Array<TokenApprovalItem>
}

export interface TaskExecuteResult {
    isSuccess: boolean,
    task?: SuperContract,
    runner?: TaskRunner | TaskCall,
    errMsg?: string,
    reciept?: any,
    events?: TransactionEventInfo[]
}

export interface JSExecuteResult {
    resCode: number,
    jsCall?: JsCall,
    errMsg?: string,
    reciept?: any,
    events?: TransactionEventInfo[]
}

export type TokenApprovalItem = {
    chainId: ChainId,
    tokenAddr: string,
    amount: BigNumberish
}

export type TokenApprovalRes = {
    tokenAddr: string,
    state: TokenApprovalResState,
    tokenDecimal: number
}

export const isTaskRunnerConf = (obj:TaskRunnerConf|JsCallConf|TaskCallConf):obj is TaskRunnerConf => {
    return (obj as TaskRunnerConf).taskRunnerKeys!==undefined;
}

export const isJsCallConf = (obj:TaskRunnerConf|JsCallConf|TaskCallConf):obj is JsCallConf => {
    return (obj as JsCallConf).jsCall!==undefined;
}

export const isTaskCallConf = (obj:TaskRunnerConf|JsCallConf|TaskCallConf):obj is TaskCallConf => {
    return (obj as TaskCallConf).taskCall!==undefined;
}

export const isSetJobVariableByEvent = (obj:SetJobVariable):obj is SetJobVariableByEvent => {
    return (obj as SetJobVariableByEvent).eventName!==undefined;
}