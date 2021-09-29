import { TaskRunnerConf, JsCallConf, TaskRunner, SuperContract, TaskExecuteResult, JSExecuteResult, isTaskRunnerConf, JobVariable, 
    SetJobVariableByTaskVariable, SetJobVariable, isSetJobVariableByEvent, SetJobVariableByEvent, SetJobVariableByReturnValue, 
    TaskCallConf, isJsCallConf, isTaskCallConf, TaskCall } from "../entities/pageModel";
import { VariableType } from "../core/constant";
import { execute, executeJsCall, executeTaskCall } from "./TaskExecutor";
import { BigNumber } from "@ethersproject/bignumber";
import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";

export const executeTasks = async function (scheduler: Array<TaskRunnerConf|JsCallConf|TaskCallConf>,  
                                            tasks: { key: string, task: SuperContract }[], 
                                            wallet: Signer | Provider, runners?: TaskRunner[], 
                                            jobVariables?:Array<JobVariable>):Promise<Array<TaskExecuteResult>> {
    let rtnRes:Array<TaskExecuteResult> = [];
    let variableValList:Array<JobVariable> = jobVariables.filter(v=>v.value);
    for (let runnerConf of scheduler) {
        if(isTaskRunnerConf(runnerConf)){
            let executeRunnerRes = await executeTaskRunner(runnerConf, runners, tasks, jobVariables, wallet);
            rtnRes = rtnRes.concat(executeRunnerRes.results);
            variableValList = variableValList.concat(executeRunnerRes.varVals);
            if(executeRunnerRes.isExit) break;
        }else if(isJsCallConf(runnerConf)){
            let executeRunnerRes = await executeJsRunner(runnerConf, variableValList, jobVariables, wallet)
            rtnRes = rtnRes.concat({...executeRunnerRes.result, isSuccess:executeRunnerRes.result.resCode!==0});
            variableValList = variableValList.concat(executeRunnerRes.varVals);
            if(executeRunnerRes.isExit) break;
        }else if(isTaskCallConf(runnerConf)){
            let executeRunnerRes = await executeTaskCallRunner(runnerConf, tasks, variableValList, jobVariables, wallet)
            rtnRes = rtnRes.concat(executeRunnerRes.results);
            variableValList = variableValList.concat(executeRunnerRes.varVals);
            if(executeRunnerRes.isExit) break;
        }
    }
    return rtnRes;
}

export const executeTaskRunner = async (taskRunnerConf:TaskRunnerConf, runners: TaskRunner[], 
    tasks: { key: string, task: SuperContract }[], jobVariables:Array<JobVariable>,  
    wallet: Signer | Provider) : Promise<{isExit:boolean, results:Array<TaskExecuteResult>,varVals:Array<JobVariable>}> => {
    let executeResList:Array<TaskExecuteResult> = [];
    let varVals:Array<JobVariable> = [];
    if (taskRunnerConf.taskRunnerKeys) {
        let sortedTasks = taskRunnerConf.taskRunnerKeys.sort((tk1, tk2) => {
            return tk1.seq - tk2.seq;
        })

        if (taskRunnerConf.isParalelle) {
            let promises: Array<Promise<TaskExecuteResult>> = []
            for (let taskRunnerKey of sortedTasks) {
                promises.push(doExecute(taskRunnerKey.key, runners, tasks, wallet));
            }
            try {
                let results = await Promise.allSettled(promises);
                for(let res of results){
                    if(res.status === "rejected"){
                        executeResList.push({isSuccess:false, errMsg:res.reason});
                    }else if(res.status === "fulfilled"){
                        let taskExecuteResult:TaskExecuteResult = res.value;
                        executeResList.push(taskExecuteResult);
                        if(taskExecuteResult.isSuccess){
                            let taskRunnerKey = taskRunnerConf.taskRunnerKeys.find(v=>v.key===taskExecuteResult.runner.key);
                            let tmpJobVars = setJobVarByTaskVar(res.value, taskRunnerKey?.setVarList, jobVariables);
                            for(let jobVar of tmpJobVars){
                                if(varVals.find(v=>v.code===jobVar.code)){
                                    varVals.splice(varVals.findIndex(v=>v.code===jobVar.code), 1, jobVar);
                                }else{
                                    varVals.push(jobVar);
                                }
                            }
                        }
                    }
                }
                const errorRes = results.find((res) => res.status === "rejected");
                const fulfillResArr = results.filter((res) => res.status === "fulfilled");
                const failFulfillRes = fulfillResArr.find((res) => !(res as PromiseFulfilledResult<TaskExecuteResult>).value.isSuccess);
                if (errorRes || failFulfillRes) {
                    // console.log("Fail to execute task");
                    if (taskRunnerConf.exitOnError) {
                        return {isExit:true,results:executeResList,varVals:varVals};
                    }
                } else {
                    // console.log("Task execute successfully");
                    
                }
            } catch (e) {
                console.error(e);
                return {isExit:true,results:executeResList,varVals:varVals};
            }
        } else {
            for (let taskRunnerKey of sortedTasks) {
                let res = await doExecute(taskRunnerKey.key, runners, tasks, wallet);
                executeResList.push(res);
                if (!res.isSuccess && taskRunnerConf.exitOnError) {
                    return {isExit:true,results:executeResList,varVals:varVals};
                }else{
                    let taskRunnerKey = taskRunnerConf.taskRunnerKeys.find(v=>v.key===res.runner.key);
                    let tmpJobVars = setJobVarByTaskVar(res, taskRunnerKey?.setVarList, jobVariables);
                    for(let jobVar of tmpJobVars){
                        if(varVals.find(v=>v.code===jobVar.code)){
                            varVals.splice(varVals.findIndex(v=>v.code===jobVar.code), 1, jobVar);
                        }else{
                            varVals.push(jobVar);
                        }
                    }
                }
            }
        }
        return {isExit:false,results:executeResList,varVals:varVals};
    }
}

export const setJobVarByTaskVar = (taskExecuteResult:TaskExecuteResult, setVarList:Array<SetJobVariableByTaskVariable>, jobVariables:Array<JobVariable>):Array<JobVariable> => {
    console.log("start setJobVarByTaskVar...")
    console.log("taskExecuteResult:",taskExecuteResult,"setVarList:",setVarList, "jobVariables:",jobVariables)
    let varValList:Array<JobVariable> = [];
    for(let setVar of setVarList){
        let taskVars = taskExecuteResult.task.variables;
        let jobVar = jobVariables.find(v=>v.code===setVar.variableCode);
        let taskVar = taskVars.find(v=>v.code===setVar.taskVariableCode);
        let events = taskExecuteResult.events.filter(e=>e.event === "SetVariable");
        let event = events.find(e=>taskVars[e.args["variableId"].toNumber()].code===setVar.taskVariableCode);
        console.log("setVar",setVar, "taskVars",taskVars, "jobVar", jobVar, "taskVar", taskVar, "events",events, "event", event)
        if(event){
            if(varValList.find(v=>v.code===jobVar.code)){
                varValList.splice(varValList.findIndex(v=>v.code===jobVar.code), 1, {...jobVar, value:formatValue(event.args["value"], taskVar.type)});
            }else{
                varValList.push({...jobVar, value:formatValue(event.args["value"], taskVar.type)})
            }
        }
    }
    return varValList;
}

export const setJobVarByJsVar = (jsExecuteResult:JSExecuteResult, setVarList:Array<SetJobVariable>, jobVariables:Array<JobVariable>):Array<JobVariable> => {
    console.log("start setJobVarByJsVar...");
    console.log("jsExecuteResult", jsExecuteResult, "setVarList", setVarList, "jobVariables", jobVariables)
    let varValList:Array<JobVariable> = [];
    for(let setVar of setVarList){
        let jobVar = jobVariables.find(v=>v.code===setVar.variableCode);
        let val = null;
        if(isSetJobVariableByEvent(setVar) && jsExecuteResult.events?.length > 0){
            let events = jsExecuteResult.events.filter(e=>e.event===(setVar as SetJobVariableByEvent).eventName);
            val = events[events.length - 1].args[(setVar as SetJobVariableByEvent).eventInputName];
        }else{
            val = jsExecuteResult.reciept[(setVar as SetJobVariableByReturnValue).returnValueIndex];
        }
        if(varValList.find(v=>v.code===jobVar.code)){
            varValList.splice(varValList.findIndex(v=>v.code===jobVar.code), 1, {...jobVar, value:val});
        }else{
            varValList.push({...jobVar, value:val})
        }
    }
    return varValList;
}

export const executeJsRunner = async (jsRunnerConf:JsCallConf, varValList: JobVariable[], jobVariables: JobVariable[], wallet: Signer | Provider)
                                :Promise<{isExit:boolean, result:JSExecuteResult,varVals:Array<JobVariable>}> => {
    let varVals:Array<JobVariable> = [];
    let res = null;
    try{
        res = await executeJsCall(jsRunnerConf.jsCall, varValList,  wallet);
        if (res.resCode===0 && jsRunnerConf.exitOnError) {
            return {isExit:true,result:res,varVals:varVals};
        } else if (res.resCode === 2){  //skip

        } else{
            varVals = setJobVarByJsVar(res, jsRunnerConf.setVarList, jobVariables);
        }
    }catch(e){
        console.error(e);
        return {isExit:true, result:res, varVals:varVals};
    }
    return {isExit:false, result:res, varVals:varVals};
}

export const executeTaskCallRunner = async (taskCallConf:TaskCallConf, tasks: { key: string, task: SuperContract }[], 
                                            varValList: JobVariable[], jobVariables: JobVariable[], wallet: Signer | Provider)
                                : Promise<{isExit:boolean, results:Array<TaskExecuteResult>,varVals:Array<JobVariable>}> => {
    let executeResList:Array<TaskExecuteResult> = [];
    let varVals:Array<JobVariable> = [];
    if (taskCallConf.taskCall) {
        let sortedTasks = taskCallConf.taskCall.sort((tc1, tc2) => {
            return tc1.seq - tc2.seq;
        })

        if (taskCallConf.isParalelle) {
            let promises: Array<Promise<TaskExecuteResult>> = []
            for (let taskCall of sortedTasks) {
                promises.push(doExecuteTaskCall(taskCall, tasks, varValList, wallet));
            }
            try {
                let results = await Promise.allSettled(promises);
                for(let res of results){
                    if(res.status === "rejected"){
                        executeResList.push({isSuccess:false, errMsg:res.reason});
                    }else if(res.status === "fulfilled"){
                        let taskExecuteResult:TaskExecuteResult = res.value;
                        executeResList.push(taskExecuteResult);
                        if(taskExecuteResult.isSuccess){
                            let tc = taskCallConf.taskCall.find(v=>v.key===taskExecuteResult.runner.key);
                            let tmpJobVars = setJobVarByTaskVar(res.value, tc.setVarList, jobVariables);
                            for(let jobVar of tmpJobVars){
                                if(varVals.find(v=>v.code===jobVar.code)){
                                    varVals.splice(varVals.findIndex(v=>v.code===jobVar.code), 1, jobVar);
                                }else{
                                    varVals.push(jobVar);
                                }
                            }
                        }
                    }
                }
                const errorRes = results.find((res) => res.status === "rejected");
                const fulfillResArr = results.filter((res) => res.status === "fulfilled");
                const failFulfillRes = fulfillResArr.find((res) => !(res as PromiseFulfilledResult<TaskExecuteResult>).value.isSuccess);
                if (errorRes || failFulfillRes) {
                    // console.log("Fail to execute task");
                    if (taskCallConf.exitOnError) {
                        return {isExit:true,results:executeResList,varVals:varVals};
                    }
                } else {
                    // console.log("Task execute successfully");
                    
                }
            } catch (e) {
                console.error(e);
                return {isExit:true,results:executeResList,varVals:varVals};
            }
        } else {
            for (let taskCall of sortedTasks) {
                let res = await doExecuteTaskCall(taskCall, tasks, varValList, wallet);
                executeResList.push(res);
                if (!res.isSuccess && taskCallConf.exitOnError) {
                    return {isExit:true,results:executeResList,varVals:varVals};
                }else{
                    let taskRunnerKey = taskCallConf.taskCall.find(v=>v.key===res.runner.key);
                    let tmpJobVars = setJobVarByTaskVar(res, taskRunnerKey?.setVarList, jobVariables);
                    for(let jobVar of tmpJobVars){
                        if(varVals.find(v=>v.code===jobVar.code)){
                            varVals.splice(varVals.findIndex(v=>v.code===jobVar.code), 1, jobVar);
                        }else{
                            varVals.push(jobVar);
                        }
                    }
                }
            }
        }
        return {isExit:false,results:executeResList,varVals:varVals};
    }
}

export const doExecute = async function (runnerKey: string, runners: TaskRunner[], tasks: { key: string, task: SuperContract }[], 
                                        wallet: Signer | Provider): Promise<TaskExecuteResult> {
    let taskRunner: TaskRunner = runners.find(r => r.key === runnerKey);
    if (!taskRunner) {
        console.log('No task runner');
        return {isSuccess:false, errMsg:'No task runner'};
    }
    let task: SuperContract = tasks.find(t => t.key === taskRunner.contractKey)?.task;
    if (task) {
        return await execute(task, wallet, taskRunner);
    } else {
        console.log(`The contract [${taskRunner.contractKey}] does not exist.`);
        return {isSuccess:false, runner:taskRunner, errMsg:`The contract [${taskRunner.contractKey}] does not exist.`};
    }
}

export const doExecuteTaskCall = async function (taskCall:TaskCall, tasks: { key: string, task: SuperContract }[], 
    varValList: JobVariable[], wallet: Signer | Provider): Promise<TaskExecuteResult> {
    let task: SuperContract = tasks.find(t => t.key === taskCall.contractKey)?.task;
    if (task) {
        return await executeTaskCall(task, taskCall, varValList, wallet);
    } else {
        console.log(`The contract [${taskCall.contractKey}] does not exist.`);
        return {isSuccess:false, runner:taskCall, errMsg:`The contract [${taskCall.contractKey}] does not exist.`};
    }
}

export const formatValue = (value: string, type: VariableType): string => {
    switch (type) {
        case VariableType.address:
            return "0x" + value.substr(value.length - 40);
        case VariableType.int:
            return BigNumber.from(value).toString();
        case VariableType.boolean:
            return BigNumber.from(value).eq(0) ? "false" : "true";
        case VariableType.bytes:
            return value;
    }
};