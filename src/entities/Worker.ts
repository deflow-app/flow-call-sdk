import { Wallet } from '@ethersproject/wallet';

export default interface Worker{
    approve:(wallet:Wallet)=>Promise<any>;
    execute:(wallet:Wallet)=>Promise<any>;
}