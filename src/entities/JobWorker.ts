import { SuperContract, TaskRunner, TaskRunnerConf,JsCallConf, Token, JobVariable } from "./pageModel";
import {CHAIN_CONFIG} from "../core"
import { Wallet } from '@ethersproject/wallet';
import Worker from "./Worker";
import { executeTasks } from "../executor/JobExecutor";
import {Contract} from '@ethersproject/contracts';
import { MaxUint256 } from "@ethersproject/constants/lib/bignumbers";
import erc20 from "../core/ERC20.json";
import { TaskCallConf } from ".";

export default class JobWorker implements Worker{
    private readonly taskRunnerConfs: Array<TaskRunnerConf|JsCallConf|TaskCallConf>;
    private readonly runners: TaskRunner[];
    private readonly tasks: { key: string, task: SuperContract }[];
    public variables : JobVariable[];

    public constructor(taskRunnerConfs:Array<TaskRunnerConf|JsCallConf|TaskCallConf>, runners:TaskRunner[], tasks:{ key: string, task: SuperContract }[],
        variables:JobVariable[]){
        this.taskRunnerConfs = taskRunnerConfs;
        this.runners = runners;
        this.tasks = tasks;
        this.variables = variables;
    }
    public async approve(wallet:Wallet){
        let approveTokens:Token[] = [];
        this.tasks.forEach(t=>{
            t.task.approveTokens && t.task.approveTokens.forEach(token=>{
                if(!approveTokens.find(to=>to.address===token.address)){
                    approveTokens.push(token);
                }
            });
        });

        for(let at of approveTokens){
            const contract = new Contract(at.address, erc20, wallet);
            let allowance = await contract.allowance(await wallet.getAddress(), CHAIN_CONFIG[at.chainId].tokenReceiver);
            if(allowance.eq(0)){
                const tx=await contract.approve(CHAIN_CONFIG[at.chainId].tokenReceiver,MaxUint256);
                await tx.wait();
            }
        };
    }

    public async execute(wallet:Wallet){
        return executeTasks(this.taskRunnerConfs, this.tasks, wallet, this.runners, this.variables);
    }
}