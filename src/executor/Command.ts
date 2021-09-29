import { TaskRunner, SuperContract, CronJob, PubObj, JobVariable } from "../entities/pageModel";
import Worker from "../entities/Worker";
import { readFileDecrypt } from "../utils/ipfs";
import { PubType, ChainId } from "../core";
import JobWorker from "../entities/JobWorker";
import TaskWorker from "../entities/TaskWorker";

export const executeJobByCID = async (cid:string, externalVars?:Array<JobVariable>):Promise<{cron:string,chainId:ChainId,worker:Worker}> => {
    let content = await readFileDecrypt(cid);
    if(!content) throw new Error("Got empty content!");
    let pubObj:PubObj = JSON.parse(content);
    if(pubObj.type !== PubType.JOB) throw new Error("Got wrong type!");
    let job:CronJob = pubObj.data as CronJob;
    let initedVars = job.variables.map(v=>{
        return {...v, value:externalVars?.find(ev=>ev.code===v.code && v.inputWhenRun)?.value}
    })
    return {cron:job.cron, chainId:job.chainId, worker:new JobWorker(job.scheduler, job.runners, job.tasks, initedVars)};
}

export const executeTaskByCID = async (cid:string, runner:TaskRunner):Promise<{chainId:ChainId, worker:Worker}> => {
    let content = await readFileDecrypt(cid);
    if(!content) throw new Error("Got empty content!");
    let pubObj:PubObj = JSON.parse(content);
    if(pubObj.type !== PubType.TASK) throw new Error("Got wrong type!");
    let task:SuperContract = pubObj.data as SuperContract;
    return {chainId:task.chainId, worker:new TaskWorker(task, runner)};
}