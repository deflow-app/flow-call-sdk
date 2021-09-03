import { CronJob, SuperContract, TaskRunner, TaskRunnerConf } from "./pageModel";
import { Wallet } from '@ethersproject/wallet';
import Worker from "./Worker";
import { executeTasks } from "../executor/JobExecutor";

export default class JobWorker implements Worker{
    private readonly taskRunnerConfs: TaskRunnerConf[];
    private readonly runners: TaskRunner[];
    private readonly tasks: { key: string, task: SuperContract }[];

    public constructor(taskRunnerConfs:TaskRunnerConf[], runners:TaskRunner[], tasks:{ key: string, task: SuperContract }[]){
        this.taskRunnerConfs = taskRunnerConfs;
        this.runners = runners;
        this.tasks = tasks;
    }

    public execute(wallet:Wallet){
        return executeTasks(this.taskRunnerConfs, this.runners, this.tasks, wallet);
    }
}