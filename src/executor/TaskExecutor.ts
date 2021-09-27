import {TriggerType, ExternalCallInfo, CallType, CallInfo, SetVariableOpr, ParameterFromVariable} from "../entities/contractModel";
import {SetVariableOperation as PostOpr, SuperCall, SuperContract, JsCall, SuperContractVariable, CallFunc, CallFuncParam, 
    TransactionReceiptEvent, TransactionEventInfo, InputWhenRun,TaskRunner, InputWhenRunType, TaskExecuteResult, JSExecuteResult,
    JobVariable} from "../entities/pageModel";
import { flowCall, flowCallSafe, javascriptCall, ChainId, CHAIN_CONFIG, CallFuncParamType, EmitEventType,
    ConstantNames, SpecialParamNameForInputWhenRun, VariableType, PARAMETER_ID_FOR_TARGET_CONTRACT, 
    PARAMETER_ID_FOR_SEND_ETH_VALUE, PARAMETER_ID_FOR_TOKEN_AMOUNT, getFlowCallABI} from "../core";
import {abiEncode, prepareExp, getMethodNmFromAbi, decodeExternalData, isNumeric} from '../utils';
import { Contract, Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import { Interface } from '@ethersproject/abi';
import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { compile } from 'expression-eval';


type PostCallsForContractWrapper = {
    key:string,
    aftSetVarOpr:SetVariableOpr
}

const flowCallInterface=new Interface(getFlowCallABI());

export async function execute(callInfoInput:SuperContract, wallet: Signer | Provider, taskRunner?:TaskRunner):Promise<TaskExecuteResult>{
    if(callInfoInput.calls){
        let safeCall = taskRunner?taskRunner.safeMode:true;
        let externalVars = taskRunner?.inputsWhenRun || [];
        let senderAddress = await (wallet as Signer).getAddress();
        let callsForContract:CallInfo[] = [];
        let postCallsForContract:SetVariableOpr[] = [];
        
        let postCallsForContractWrapper:PostCallsForContractWrapper[] = assembleBeforeAll(callInfoInput.setVariableOperations, externalVars, callInfoInput.variables);

        for(let call of callInfoInput.calls){
            // console.log(call);
            
            let {callData, paramsSet, callCondition, tokenAmount, targetContract, sendEthValue} = assembleCallInput(call, callInfoInput.variables, callInfoInput.chainId, senderAddress, externalVars);
            callsForContract.push({
                callType:call.callType,
                seq: call.seq,
                callCondition: callCondition,
                targetContract: targetContract ? targetContract : '0x0000000000000000000000000000000000000000',
                callData: callData,
                sendEthValue: sendEthValue ? sendEthValue : "0",
                variableParameters: paramsSet,
                returnValuesCount: call.callFunc && call.callFunc.returnValuesCount ? call.callFunc.returnValuesCount : 0,
                tokenAmount: tokenAmount
            })
        }

        let postOperates:PostOpr[] = callInfoInput.setVariableOperations;
        for(let i = 0; i < postOperates.length; i ++){
            let postOpr = postOperates[i];
            let trid:number = -1;
            trid = getTridFromCalls(postOpr.triggerId, callInfoInput.calls);
            if(trid >= 0 && postOpr.type === TriggerType.afterCall){
                postCallsForContractWrapper = assemblePostCall(trid, postOpr, callInfoInput.variables, postCallsForContractWrapper);
                postCallsForContractWrapper = assembleAfterSetVarOprs(postCallsForContractWrapper, postOperates, callInfoInput.variables);
            }
        }

        postCallsForContract = postCallsForContractWrapper.map(wrapper=>{
            return wrapper.aftSetVarOpr;
        })

        let tokenAddrs:Array<string> = [];
        if(callInfoInput.approveTokens){
            tokenAddrs = callInfoInput.approveTokens.map(t=>{
                return t.address;
            })
        }
        let transRes;
        // console.log("callsForContract", callsForContract, "postCallsForContract", postCallsForContract);
        let sendEthValue="0";
        const input=taskRunner?.inputsWhenRun?.find(v=>v.inputWhenRunType==InputWhenRunType.sendEthToFlowCall);
        if(input){
            sendEthValue=input.value;
        }
        try{
            if(safeCall){
                transRes = await flowCallSafe(callsForContract, callInfoInput.variables.length, postCallsForContract, wallet, callInfoInput.chainId, sendEthValue, tokenAddrs);
            }else{
                transRes = await flowCall(callsForContract, callInfoInput.variables.length, postCallsForContract, wallet, callInfoInput.chainId,sendEthValue);
            }
            return {isSuccess:true, task:callInfoInput, runner:taskRunner, reciept:transRes, 
                events:analyzeCallEvents(callInfoInput.calls.map(ca=>{return {contractAddr:ca.contractAddr, abiInfo:ca.abiInfo}}), transRes)};
        }catch(e2){
            // console.error(e2);
            let reciept= e2;
            let message=e2.message;
            if (e2.code == -32603) {
                //Internal JSON-RPC error
                try{
                    flowCallInterface.decodeFunctionResult("flowCall",e2.data.data);
                }catch(e3){
                    reciept=e3;
                    if(e3.errorName==="ExternalCallError"){
                        const callId=BigNumber.from(e3.errorArgs[0]).toNumber();
                        message=`Got error when invoking [${callInfoInput?.calls[callId]?.name}] (id=${callId})`;
                    }
                    else
                        message=e3.reason;
                }
            }

            // console.error("Error decoded: ",reciept);
            return {isSuccess:false, task:callInfoInput, runner:taskRunner, reciept:reciept, errMsg: message};
        }
    }
    return {isSuccess:false, task:callInfoInput, runner:taskRunner, errMsg:'Invalid task'};
}

export async function executeJsCall(jsCall:JsCall, varValList:Array<JobVariable>, wallet: Signer | Provider):Promise<JSExecuteResult>{
    if(jsCall.callCondition){
        let str = jsCall.callCondition;
        console.log("js call condition before:", str)
        let varNames = [];
        if(/\{\w+\}/.test(str)){
            let vars:Array<string>|null = str.match(/\{\w+\}/gi);
            for(let v of vars){
                let varNm = v.substring(1, v.indexOf('}'));
                varNames.push(varNm);
                str = str.replace(v, varNm);
            }
        }
        console.log("js call condition after:", str)
        const fn = compile(str);
        let params:{[name:string]:any} = {};
        for(let varNm of varNames){
            let varVal = varValList.find(val=>val.name===varNm);
            params[varNm]= varVal ? varVal.value: null;
        }
        console.log("params", params);
        let isCall = fn(params);
        console.log("isCall:", isCall);
        if(!isCall){
            return {resCode:2, jsCall:jsCall}; 
        }
    }
    let sendEthValue = 0;
    let senderAddress = await (wallet as Signer).getAddress();
    if(jsCall.sendEthValue && jsCall.sendEthValue.toString().startsWith("{")){
        let ethVal = sendEthValue.toString();
        let varVal = varValList.find(v=>v.name===ethVal.substring(1, ethVal.indexOf("}")));
        sendEthValue = varVal.value;
    }
    let params:CallFuncParam[] = jsCall.callFunc?.params;
    let callFuncParamVals:any[] = [];
    for(let i = 0; i < params.length; i ++){
        if(params[i].type == CallFuncParamType.var){
            let varVal = varValList.find(v=>v.code===params[i].value);
            callFuncParamVals.push(varVal.value)
        }else if(params[i].type == CallFuncParamType.val){
            callFuncParamVals.push(assembleCallFuncParamVal(params[i].value));
        }else if(params[i].type == CallFuncParamType.const){
            let constName:ConstantNames = params[i].value;
            if(constName === ConstantNames.flowCallContract){
                callFuncParamVals.push(CHAIN_CONFIG[jsCall.chainId].contractAddress);
            }else if(constName === ConstantNames.senderAddress){
                callFuncParamVals.push(senderAddress);
            }
        }
    }

    let contractAddr = jsCall.contractAddr;
    if(contractAddr.startsWith("<")){
        let constName = contractAddr.substring(1, contractAddr.indexOf(">"));
        if(constName === ConstantNames.flowCallContract){
            contractAddr = CHAIN_CONFIG[jsCall.chainId].contractAddress;
        }else if(constName === ConstantNames.senderAddress){
            contractAddr = senderAddress;
        }
    }else if(contractAddr.startsWith("{")){
        let varVal = varValList.find(v=>v.name===contractAddr.substring(1, contractAddr.indexOf("}")));
        contractAddr = varVal.value;
    }
    try{
        let call = {contractAddr:contractAddr, abiInfo:jsCall.abiInfo}
        let transRes = await javascriptCall(contractAddr, jsCall.abiInfo, jsCall.callFunc.name, callFuncParamVals, wallet, jsCall.chainId, sendEthValue);
        return {resCode:1, jsCall:jsCall, reciept:transRes, events:analyzeCallEvents([call], transRes)};
    }catch(e){
        return {resCode:0, jsCall:jsCall, errMsg: e.message};
    }
}

function assembleCallInput(call:SuperCall, variables:SuperContractVariable[], chainId:ChainId, senderAddr:string, externalVars:InputWhenRun[])
                    :{callData:string, paramsSet:ParameterFromVariable[], callCondition:BigNumberish[], tokenAmount:BigNumberish, 
                        sendEthValue:BigNumberish, targetContract:string}{
    // console.log("call",call, "variables", variables,  "externalVars",externalVars);
    let callData = null;
    let paramsSet:ParameterFromVariable[] = [];
    let callCondition:BigNumberish[]|null;
    let tokenAmount:BigNumberish = "0";
    let targetContract = call.contractAddr;
    let sendEthValue = call.sendEthValue?call.sendEthValue:"0";

    let callFunc:CallFunc = call.callFunc ? call.callFunc : null;
    let params:CallFuncParam[] = callFunc && callFunc.params ? callFunc.params : [];

    // console.log("call info", call);
    if(CallType.callContract === call.callType){
        let callFuncParamVals:any[] = [];

        let {tmpContractAddr, tmpParamsSet} = extractAddressInfo(call.id, targetContract, paramsSet, externalVars, variables, chainId, senderAddr);
        targetContract = tmpContractAddr;
        paramsSet = tmpParamsSet;

        if(sendEthValue === '<'+ConstantNames.inputWhenRun+'>'){
            sendEthValue = getValFromExternalVars(call.id, SpecialParamNameForInputWhenRun.tokenAmount, externalVars);
        }else if(sendEthValue.toString().startsWith("{")){
            let ethVal = sendEthValue.toString();
            paramsSet.push({
                parameterId: PARAMETER_ID_FOR_SEND_ETH_VALUE,
                variableId: getVarId(ethVal.substring(1, ethVal.indexOf("}")), variables)
            })
            sendEthValue = 0;
        }

        for(let i = 0; i < params.length; i ++){
            if(params[i].type == CallFuncParamType.var){
                paramsSet.push({
                    parameterId: i,
                    variableId: getVarId(params[i].value, variables, false)
                })

                let tmpVar = variables.find(v=>v.code === params[i].value);
                if(tmpVar.type === VariableType.address){
                    callFuncParamVals.push('0x0000000000000000000000000000000000000000');
                }else{
                    callFuncParamVals.push('0');
                }
            }else if(params[i].type == CallFuncParamType.val){
                callFuncParamVals.push(assembleCallFuncParamVal(params[i].value));
            }else if(params[i].type == CallFuncParamType.const){
                let constName:ConstantNames = params[i].value;
                if(constName === ConstantNames.flowCallContract){
                    callFuncParamVals.push(CHAIN_CONFIG[chainId].contractAddress);
                }else if(constName === ConstantNames.senderAddress){
                    callFuncParamVals.push(senderAddr);
                }else if(constName === ConstantNames.flowCallHelper){
                    callFuncParamVals.push(CHAIN_CONFIG[chainId].flowCallHelper);
                }else if(constName === ConstantNames.inputWhenRun){
                    callFuncParamVals.push(assembleCallFuncParamVal(getValFromExternalVars(call.id, params[i].name, externalVars)));
                }
            }
        }
        callData = abiEncode(call.abiInfo, callFunc.name, callFuncParamVals);
        callCondition = prepareExp(transformVar(call.callCondition, variables));
    }else if(CallType.safeReceive === call.callType){
        if(call.tokenAmount === '<'+ConstantNames.inputWhenRun+'>'){
            tokenAmount = getValFromExternalVars(call.id, SpecialParamNameForInputWhenRun.tokenAmount, externalVars);
        }else if(call.tokenAmount.toString().startsWith("{")){
            let tokenAmtStr = call.tokenAmount.toString();
            paramsSet.push({
                parameterId: PARAMETER_ID_FOR_TOKEN_AMOUNT,
                variableId: getVarId(tokenAmtStr.substring(1, tokenAmtStr.indexOf("}")), variables)
            })
        }else{
            tokenAmount = call.tokenAmount ? call.tokenAmount.toString() : "0";
        }

        let {tmpContractAddr, tmpParamsSet} = extractAddressInfo(call.id, targetContract, paramsSet, externalVars, variables, chainId, senderAddr);
        targetContract = tmpContractAddr;
        paramsSet = tmpParamsSet;

        callCondition = prepareExp(transformVar(call.callCondition, variables));
    }else if(CallType.execRevert === call.callType){
        callCondition = prepareExp(transformVar(call.callCondition, variables));
    }
    callData = callData || "0x00000000"
    if(callCondition){
        callCondition = callCondition.map(v=>{
            return v.toString();
        })
    }
    callCondition =  callCondition || [];
    return {callData, paramsSet, callCondition, tokenAmount, targetContract, sendEthValue};
}

function extractAddressInfo(callId:string, contractAddr:string, paramsSet:ParameterFromVariable[], externalVars:InputWhenRun[], 
    variables:SuperContractVariable[], chainId:ChainId, senderAddr:string):
    {tmpContractAddr:string, tmpParamsSet:ParameterFromVariable[]}{
        let tmpContractAddr = contractAddr;
        let tmpParamsSet = paramsSet;
        if(tmpContractAddr.startsWith("<")){
            let constName = tmpContractAddr.substring(1, tmpContractAddr.indexOf(">"));
            if(constName === ConstantNames.inputWhenRun){
                tmpContractAddr = getValFromExternalVars(callId, SpecialParamNameForInputWhenRun.contractAddr, externalVars);
            }else if(constName === ConstantNames.flowCallContract){
                tmpContractAddr = CHAIN_CONFIG[chainId].contractAddress;
            }else if(constName === ConstantNames.senderAddress){
                tmpContractAddr = senderAddr;
            }else if(constName === ConstantNames.flowCallHelper){
                tmpContractAddr = CHAIN_CONFIG[chainId].flowCallHelper;
            }
        }else if(tmpContractAddr.startsWith("{")){
            tmpParamsSet.push({
                parameterId: PARAMETER_ID_FOR_TARGET_CONTRACT,
                variableId: getVarId(tmpContractAddr.substring(1, tmpContractAddr.indexOf("}")), variables)
            })
            tmpContractAddr = "0x0000000000000000000000000000000000000000";
        }
        return {tmpContractAddr, tmpParamsSet};
}

function assembleBeforeAll(postOperates:PostOpr[], externalVars:InputWhenRun[], variables:SuperContractVariable[]):PostCallsForContractWrapper[]{
    // console.log("externalVars", externalVars);
    let postCallsForContract:PostCallsForContractWrapper[] = [];
    for(let postOpr of postOperates){
        if(postOpr.type === TriggerType.beforeAll){
            // console.log("postOpr", postOpr);
            postCallsForContract.push({key: postOpr.id, aftSetVarOpr:{
                variableIdToSet:getVarId(postOpr.variableCodeToSet, variables, false),
                triggerType:postOpr.type,
                triggerId:0,
                valueExpression:['0', assembleCallFuncParamVal(getValFromExternalVars(postOpr.id, postOpr.variableCodeToSet, externalVars, false).toString())]
            }})
        }
    }
    return postCallsForContract;
}

function assemblePostCall(id:number, postOpr:PostOpr, variables:SuperContractVariable[], postCallsForContract:PostCallsForContractWrapper[]):PostCallsForContractWrapper[]{
    let ve = postOpr.valueExp;
    postOpr.valueExp = transformVar(ve, variables);

    if(!postCallsForContract.find(v=>v.key===postOpr.id)){
        postCallsForContract.push({key: postOpr.id, aftSetVarOpr:{
            variableIdToSet:getVarId(postOpr.variableCodeToSet, variables,false),
            triggerType:postOpr.type,
            triggerId:id,
            valueExpression:prepareExp(postOpr.valueExp)
        }})
    }
    return postCallsForContract;
}

function assembleAfterSetVarOprs(postCallsForContractWrapper:PostCallsForContractWrapper[], postOperates:PostOpr[], variables:SuperContractVariable[]):PostCallsForContractWrapper[]{
    for(let i=0; i < postOperates.length; i ++){
        let postOpr = postOperates[i];
        for(let j = 0; j < postCallsForContractWrapper.length; j ++){
            if(postCallsForContractWrapper[j].key === postOpr.triggerId && postOpr.type===TriggerType.afterSetVariableOperation){
                postCallsForContractWrapper = assemblePostCall(j, postOpr, variables, postCallsForContractWrapper);
                let newPostOprArr = [...postOperates];
                newPostOprArr.splice(i, 1);
                postCallsForContractWrapper = assembleAfterSetVarOprs(postCallsForContractWrapper, newPostOprArr, variables);
                continue;
            }
        }
    }
    return postCallsForContractWrapper;
}

function getValFromExternalVars(oprId:string, varCode:string, externalVars:InputWhenRun[], isCall:boolean=true):any{
    if(!externalVars) throw new Error('There does not exist any external vars! Please confirm the task config.');
    let filteredVar:InputWhenRun;
    if(isCall){
        filteredVar = externalVars.find(v=>v.callId===oprId&&v.callFuncParamName===varCode&&v.inputWhenRunType===InputWhenRunType.call);
    }else{
        filteredVar = externalVars.find(v=>v.setVariableOperationId===oprId&&v.inputWhenRunType===InputWhenRunType.setVariableOperation);
    }
    if(!filteredVar) throw new Error('No matched external var');
    return filteredVar.value;
}

function transformVar(str:string, variables:SuperContractVariable[]):string{
    if(/\{\w+\}/.test(str)){
        let vars:Array<string>|null = str.match(/\{\w+\}/gi);
        if(vars != null){
            for(let i = 0; i < vars.length; i ++){
                let tmpVar = vars[i].substring(1, vars[i].lastIndexOf("}"))
                if(!isNumeric(tmpVar)){
                    // console.log(vars[i].toString());
                    let varId = getVarId(tmpVar, variables);
                    // console.log(varId);
                    str = str.replace(vars[i]?.toString(), "{"+varId+"}");
                }
            }
        }
    }
    return str;
}

function assembleCallFuncParamVal(paramVal:any):any{
    if(paramVal && typeof paramVal === 'string'){
        if(/^\[.+\]$/.test(paramVal)){
            let rtnArr:string[] = [];
            paramVal = paramVal.substring(1, paramVal.length - 1);
            let vals:string[] = paramVal.split(",");
            for(let val of vals){
                if(val.startsWith("\"")){
                    rtnArr.push(val.replace(/\"/g, ""));
                }else if(val.startsWith("\'")){
                    rtnArr.push(val.replace(/\'/g, ""));
                }
            }
            return rtnArr;
        }
    }
    return paramVal;
}

function getVarId(varNmOrCd:string, variables:SuperContractVariable[], byName=true):number{
    for(let idx = 0; idx < variables.length; idx ++){
        if(byName){
            if(varNmOrCd === variables[idx].name){
                return idx;
            }
        }else{
            if(varNmOrCd === variables[idx].code){
                return idx;
            }
        }
    }
    throw new Error("Not match any variable");
}

function getTridFromCalls(triggerId: string, calls: SuperCall[]): number {
    for(let i = 0; i < calls.length; i ++){
        if(triggerId == calls[i].id){
            return i;
        }
    }
    return -1;
}

function analyzeCallEvents(calls: {contractAddr:string, abiInfo:any}[], transRes: any): TransactionEventInfo[] {
    let transEventInfos:TransactionEventInfo[]=[];
    if(transRes.events){
        for(let i = 0; i < transRes.events.length; i ++){
            let transRptEvent:TransactionReceiptEvent = transRes.events[i];
            if(transRptEvent.event == EmitEventType.ExternalCall || transRptEvent.event == EmitEventType.SetVariable){
                let transEventInfo:TransactionEventInfo = {
                    event:transRptEvent.event,
                    eventSignature:transRptEvent.eventSignature,
                    args:transRptEvent.args
                }

                let externalCallInfo:ExternalCallInfo = null;
                if(transRptEvent.event == EmitEventType.ExternalCall){
                    externalCallInfo = decodeExternalCallData(calls, transRptEvent.args[2], transRptEvent.args[3]);
                    if(externalCallInfo){
                        transEventInfo.externalCall = externalCallInfo;
                    }
                }

                transEventInfos.push(transEventInfo);
            }
        }
    }
    return transEventInfos;
}

function decodeExternalCallData(calls: {contractAddr:string, abiInfo:any}[], callData: string, returnData:string): ExternalCallInfo {
    for(let i = 0; i < calls.length; i ++){
        if(calls[i].abiInfo){
            let methodNm:string = getMethodNmFromAbi(calls[i].contractAddr, calls[i].abiInfo, callData);
            if(methodNm){
                return decodeExternalData(calls[i].abiInfo, methodNm, callData, returnData);
            }
        }
    }
    return null;
}

