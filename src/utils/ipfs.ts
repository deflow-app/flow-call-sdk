import {create as ipfsHttpClient} from 'ipfs-http-client';
import { CID } from 'multiformats/cid';
import { concat as uint8ArrayConcat } from "uint8arrays/concat";
import { encrypt, decrypt } from "./encrypt";

let ipfs = null

const connectToIPFS = ()=>{
    console.log('start connect to public gateway')
    if (ipfs) {
        console.log('IPFS already connected')
    } else {
        try {
            console.time('IPFS Connected')    // start timer
            ipfs = ipfsHttpClient({url:'https://ipfs.infura.io:5001/api/v0'});
            console.timeEnd('IPFS Connected') // stop timer and log duration in console
        } catch (error) {
            console.error('IPFS connect error:', error)
            ipfs = null;
        }
    }
    return ipfs;
}

export const writeFileEncrypt = async (content:string):Promise<string>=>{
    let encContent = encrypt(content);
    return writeFile(encContent);
}

export const writeFile = async (content:string):Promise<string>=>{
    let node = connectToIPFS();
    if(node){
        let {cid,} = await node.add({content:content}, {chunker:'size-262144','cidVersion':0,hashAlg:'sha2-256',pin:true});
        if(cid){
            return cid.toV0().toString();
        }
    }else{
        throw new Error('Not connect to IPFS!');
    }
}

export const readFileDecrypt = async (cid:string):Promise<string> => {
    let content = await readFile(cid);
    let tmp = decrypt(content);
    if(typeof tmp === 'object'){
        return JSON.stringify(tmp);
    }
    return tmp.toString();
}

export const readFile = async (cid:string):Promise<string> => {
    let node = connectToIPFS();
    if(node){
        let buffer = new Uint8Array(0)
        for await (const chunk of ipfs.cat(CID.parse(cid))) {
            buffer = uint8ArrayConcat([buffer, chunk])
        }
        var dataString = "";
        for (var i = 0; i < buffer.length; i++) {
            if(buffer[i] === 0x00) continue;
            dataString += String.fromCharCode(buffer[i]);
        }
        return dataString.trim();
    }else{
        throw new Error('Not connect to IPFS!');
    }
}