import aes from "crypto-js/aes";
import pkcs7 from "crypto-js/pad-pkcs7";
import encUTF8 from "crypto-js/enc-utf8";
import encLatin1 from "crypto-js/enc-latin1";

const salt = encLatin1.parse('deflow_salt_20210824');
const iv = encLatin1.parse('VECTOR0000000000');

export const encrypt = (content:string):string => {
    return aes.encrypt(content, salt, {iv:iv,padding:pkcs7}).toString();
}

export const decrypt = (content:string):string =>{
    let tmp = aes.decrypt(content, salt, {iv:iv,padding:pkcs7});
    return encUTF8.stringify(tmp).toString();
}