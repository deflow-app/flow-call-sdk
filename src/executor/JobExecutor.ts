import { TaskRunnerConf, TaskRunner, SuperContract } from "../entities/pageModel";
import { execute } from "./TaskExecutor";
import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";


export const executeTasks = async function (taskRunnerConfs: TaskRunnerConf[], runners: TaskRunner[], 
                                            tasks: { key: string, task: SuperContract }[], wallet: Signer | Provider) {
    for (let taskRunnerConf of taskRunnerConfs) {
        if (taskRunnerConf.taskRunnerKeys) {
            let sortedTasks = taskRunnerConf.taskRunnerKeys.sort((tk1, tk2) => {
                return tk1.seq - tk2.seq;
            })

            if (taskRunnerConf.isParalelle) {
                let promises: Array<Promise<boolean>> = []
                for (let taskRunnerKey of sortedTasks) {
                    promises.push(doExecute(taskRunnerKey.key, runners, tasks, wallet));
                }
                try {
                    let results = await Promise.allSettled(promises);
                    const errorRes = results.find((res) => res.status === "rejected");
                    const fulfillResArr = results.filter((res) => res.status === "fulfilled");
                    const failFulfillRes = fulfillResArr.find((res) => !(res as PromiseFulfilledResult<boolean>).value);
                    console.log("errorRes", errorRes, "fulfillResArr", fulfillResArr, "failFulfillRes", failFulfillRes);
                    if (errorRes || failFulfillRes) {// && taskRunnerConf.exitOnError){
                        console.log("Fail to execute task");
                        if (taskRunnerConf.exitOnError) {
                            return;
                        }
                    } else {
                        console.log("Task execute successfully");
                    }
                } catch (e) {
                    console.error(e);
                }
            } else {
                for (let taskRunnerKey of sortedTasks) {
                    let flg = await doExecute(taskRunnerKey.key, runners, tasks, wallet);
                    if (!flg && taskRunnerConf.exitOnError) {
                        return;
                    }
                }
            }
        }
    }
}

export const doExecute = async function (runnerKey: string, runners: TaskRunner[], tasks: { key: string, task: SuperContract }[], 
                                        wallet: Signer | Provider): Promise<boolean> {
    let taskRunner: TaskRunner = runners.find(r => r.key === runnerKey);
    if (!taskRunner) {
        console.log('No task runner');
        return false;
    }
    let task: SuperContract = tasks.find(t => t.key === taskRunner.contractKey)?.task;
    if (task) {
        let rtn: boolean = true;
        execute(task, wallet, taskRunner).then(res => {
            console.log("Execution res:", res);
            rtn = true;
        }).catch(e => {
            console.log("error occurred while executing tasks", e);
            rtn = false;
        });
        return rtn;
    } else {
        console.log(`The contract [${taskRunner.contractKey}] does not exist.`);
        return false;
    }
}