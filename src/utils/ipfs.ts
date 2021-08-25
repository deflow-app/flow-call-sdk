import { IPFS, create } from 'ipfs';
import { CID } from 'multiformats/cid';
import { concat } from "uint8arrays/concat";
import SimpleCrypto from "simple-crypto-js";
import { stringify } from 'querystring';

const simpleCrypto = new SimpleCrypto('deflow_salt_20210824')

export type StatRes = {
   cid: CID
   size: number
   cumulativeSize: number
   type: 'directory' | 'file'
   blocks: number
   withLocality: boolean
   local?: boolean
   sizeLocal?: number
   mode?: number
}

const createIPFS = async () => {
  return await create({repo:'deflowrepo'});
}

export const writeFile = async (fileName:string, fileContent:string, owner:string):Promise<[string,CID]>=>{
  let node;
  try {
    node = await createIPFS();
    const filePath = "/deflow_contents/" + owner + "/" + fileName;
    await node.files.write(filePath, simpleCrypto.encrypt(fileContent), {create:true, parents:true, cidVersion:0, flush:true});
    const stats = await node.files.stat(filePath);
    return [filePath, stats.cid];
  } catch (error) {
    console.error(error);
    throw new Error("write file error");
  } finally{
    if(node){
      node.stop();
    }
  }
}

export const readFile = async (filePath:string|CID): Promise<string> => {
  let node;
  try {
    node = await createIPFS();
    let buffer = new Uint8Array(0)
    for await (const chunk of node.files.read(filePath)) {
      buffer = concat([buffer, chunk], buffer.length + chunk.length)
    }
    var dataString = "";
    for (var i = 0; i < buffer.length; i++) {
      dataString += String.fromCharCode(buffer[i]);
    }
    let tmp = simpleCrypto.decrypt(dataString);
    if(typeof tmp === 'object'){
      return JSON.stringify(tmp);
    }
    return tmp.toString();
  } catch (error) {
    console.error(error);
    throw new Error("read file error");
  } finally{
    if(node){
      node.stop();
    }
  }
}

export const statFile = async (filePath:string):Promise<StatRes>=>{
  let node;
  try {
    node = await createIPFS();
    const stats:StatRes = await node.files.stat(filePath);
    return stats;
  } catch (error) {
    console.error(error);
    throw new Error("get stat error");
  } finally{
    if(node){
      node.stop();
    }
  }
}

export const rmFiles = async (filePaths:Array<string>)=>{
  let node;
  try {
    node = await createIPFS();
    await node.files.rm(filePaths);
  } catch (error) {
    console.error(error);
    throw new Error("get stat error");
  } finally{
    if(node){
      node.stop();
    }
  }
}