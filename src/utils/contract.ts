import { Result ,Interface} from "@ethersproject/abi";

import {ContractMethod, ContractAbiFragmentType, ExternalCallInfo} from "../entities/contractModel"

let METHOD_NAME_MAP:{[key:string]:string} = {};

export function abiEncode(abi:any, funcNm:string, params:any[]):string{
    let intf = new Interface(abi);
    return intf.encodeFunctionData(funcNm, params);
}

export function getMethodNmFromAbi(contractAddr:string, abi:any, callData:string):string|null{
    let methodId:string = callData.substring(0,10);
    let key:string = contractAddr+"_"+methodId;
    if(METHOD_NAME_MAP[key]){
        return METHOD_NAME_MAP[key];
    }

    if(abi){
        let intf = new Interface(abi);
        let contractMethods:ContractMethod[] = JSON.parse(JSON.stringify(abi));
        for(let i = 0; i < contractMethods.length; i ++){
            if(contractMethods[i].type == ContractAbiFragmentType.function
                    && intf.getSighash(contractMethods[i].name) == methodId){
                METHOD_NAME_MAP[key] = contractMethods[i].name;
                return contractMethods[i].name;
            }
        }
    }
    return null;
}

export function decodeExternalData(abi:any, funcNm:string, callData:string, returnData:string):ExternalCallInfo{
    let intf = new Interface(abi);
    return {
        method: funcNm,
        inputParams: intf.decodeFunctionData(funcNm, callData),
        callRes: intf.decodeFunctionResult(funcNm, returnData)
    }
}