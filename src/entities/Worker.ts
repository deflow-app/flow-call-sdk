import { Wallet } from '@ethersproject/wallet';

export default interface Worker{
    execute:(wallet:Wallet)=>Promise<any>;
}