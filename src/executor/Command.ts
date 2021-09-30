import { TaskRunner, SuperContract, CronJob, PubObj, JobVariable } from "../entities/pageModel";
import Worker from "../entities/Worker";
import { readFileDecrypt } from "../utils/ipfs";
import { PubType, ChainId } from "../core";
import JobWorker from "../entities/JobWorker";
import TaskWorker from "../entities/TaskWorker";

export const fetchByCID = async (cid:string,type:PubType):Promise<any>=>{
    let content = await readFileDecrypt(cid);
    if(!content) throw new Error("Got empty content!");
    let pubObj:PubObj = JSON.parse(content);
    if(pubObj.type !== type) throw new Error("Got wrong type!");
    let job:CronJob = pubObj.data as CronJob;
    return job;
}

export const executeJobByCID = async (cid:string, externalVars?:Array<JobVariable>):Promise<{cron:string,chainId:ChainId,worker:Worker}> => {
    let job:CronJob = await fetchByCID(cid,PubType.JOB);
    let initedVars = job.variables.map(v=>{
        return {...v, value:externalVars?.find(ev=>ev.code===v.code && v.inputWhenRun)?.value}
    })
    return {cron:job.cron, chainId:job.chainId, worker:new JobWorker(job.scheduler, job.runners, job.tasks, initedVars)};
}

export const executeTaskByCID = async (cid:string, runner:TaskRunner):Promise<{chainId:ChainId, worker:Worker}> => {
    let task:SuperContract = await fetchByCID(cid,PubType.TASK);
    return {chainId:task.chainId, worker:new TaskWorker(task, runner)};
}