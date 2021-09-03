import {SuperContract, TaskRunner } from "./pageModel";
import { Wallet } from '@ethersproject/wallet';
import Worker from "./Worker";
import { execute } from "../executor/TaskExecutor";

export default class TaskWorker implements Worker{
    private readonly task:SuperContract;
    private readonly runner:TaskRunner;

    public constructor(task:SuperContract, runner:TaskRunner){
        this.task = task;
        this.runner = runner;
    }

    public async execute(wallet:Wallet){
        return execute(this.task, wallet, this.runner);
    }
}