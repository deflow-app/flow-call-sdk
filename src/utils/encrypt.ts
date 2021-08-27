import SimpleCrypto from "simple-crypto-js";

const simpleCrypto = new SimpleCrypto('deflow_salt_20210824')

export const encrypt = (content:string):string => {
    return simpleCrypto.encrypt(content);
}

export const decrypt = (content:string):string =>{
    let tmp = simpleCrypto.decrypt(content);
    if(typeof tmp === 'object'){
        return JSON.stringify(tmp);
    }
    return tmp.toString();
}