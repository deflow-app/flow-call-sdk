import { TaskRunnerConf, TaskRunner, SuperContract, TaskExecuteResult } from "../entities/pageModel";
import { execute } from "./TaskExecutor";
import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";


export const executeTasks = async function (taskRunnerConfs: TaskRunnerConf[], runners: TaskRunner[], 
                                            tasks: { key: string, task: SuperContract }[], wallet: Signer | Provider):Promise<Array<TaskExecuteResult>> {
    let rtnRes:Array<TaskExecuteResult> = [];
    for (let taskRunnerConf of taskRunnerConfs) {
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
                            rtnRes.push({isSuccess:false, errMsg:res.reason});
                        }else if(res.status === "fulfilled"){
                            rtnRes.push(res.value);
                        }
                    }
                    const errorRes = results.find((res) => res.status === "rejected");
                    const fulfillResArr = results.filter((res) => res.status === "fulfilled");
                    const failFulfillRes = fulfillResArr.find((res) => !(res as PromiseFulfilledResult<TaskExecuteResult>).value.isSuccess);
                    if (errorRes || failFulfillRes) {// && taskRunnerConf.exitOnError){
                        // console.log("Fail to execute task");
                        if (taskRunnerConf.exitOnError) {
                            return;
                        }
                    } else {
                        // console.log("Task execute successfully");
                    }
                } catch (e) {
                    console.error(e);
                }
            } else {
                for (let taskRunnerKey of sortedTasks) {
                    let res = await doExecute(taskRunnerKey.key, runners, tasks, wallet);
                    rtnRes.push(res);
                    if (!res.isSuccess && taskRunnerConf.exitOnError) {
                        return;
                    }
                }
            }
        }
    }
    return rtnRes;
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