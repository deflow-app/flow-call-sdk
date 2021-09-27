import { TaskRunner, TaskRunnerConf, SuperContract, CronJob, PubObj, isTaskRunnerConf } from "../entities/pageModel";
import Worker from "../entities/Worker";
import { readFileDecrypt } from "../utils/ipfs";
import { PubType, ChainId } from "../core";
import JobWorker from "../entities/JobWorker";
import TaskWorker from "../entities/TaskWorker";

export const executeJobByCID = async (cid:string):Promise<{cron:string,chainId:ChainId,worker:Worker}> => {
    let content = await readFileDecrypt(cid);
    if(!content) throw new Error("Got empty content!");
    let pubObj:PubObj = JSON.parse(content);
    if(pubObj.type !== PubType.JOB) throw new Error("Got wrong type!");
    let job:CronJob = pubObj.data as CronJob;
    return {cron:job.cron, chainId:job.chainId, worker:new JobWorker(job.scheduler, job.runners, job.tasks, job.variables)};
}

export const executeTaskByCID = async (cid:string, runner:TaskRunner):Promise<{chainId:ChainId, worker:Worker}> => {
    let content = await readFileDecrypt(cid);
    if(!content) throw new Error("Got empty content!");
    let pubObj:PubObj = JSON.parse(content);
    if(pubObj.type !== PubType.TASK) throw new Error("Got wrong type!");
    let task:SuperContract = pubObj.data as SuperContract;
    return {chainId:task.chainId, worker:new TaskWorker(task, runner)};
}