import { BigNumberish } from "ethers";
import { Result } from "@ethersproject/abi";

export enum CallType{
    callContract=0,
    execRevert=1,
    safeReceive=2
}

export interface CallInfo{
    callType:CallType;
    seq:number;
    callCondition:BigNumberish[];
    targetContract:string;
    callData:string;
    sendEthValue:BigNumberish;
    variableParameters:ParameterFromVariable[];
    returnValuesCount:number;
    tokenAmount:BigNumberish;
}

export interface ParameterFromVariable{
    parameterId:number;
    variableId:number;
}

export enum TriggerType{
    afterCall=0,
    afterSetVariableOperation=1,
    beforeAll=2
}

export enum ContractAbiFragmentType{
    function="function",
    event="event",
    constructor="constructor",
    error="error"
}

export interface SetVariableOpr {
    variableIdToSet:number;
    triggerType:TriggerType;
    triggerId:number; //callId or operationId according to the trigger type
    valueExpression:BigNumberish[];
}

export interface ContractMethod{
    type:string,
    name:string
}

export interface ExternalCallInfo{
    method:string,
    inputParams:Result,
    callRes:Result
}