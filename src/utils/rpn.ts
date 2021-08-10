import { OpCodeDict, OpCode } from "../core/constant";

/**
 * 处理表达式生成逆波兰式(后缀表达式)
 * @param exp 
 * @returns 
 */
export function expToRpn(exp:string):string[]|null{
    let _precedence:{ [key: string]: number;} = {'√':99,'/': 2, '*': 2, '%': 2, '-': 1, '+': 1, '#': 0};
    let arrExp:Array<String>|null = splitExp(exp),
    expStack:string[] = [], opStack:string[] = [], opItem:string, stackItem:string;
    console.log(arrExp);
    if (arrExp == null) {
        return null;
    }
    arrExp = arrExp.concat('#');
    for (var looper = 0; looper < arrExp.length; looper++) {
        opItem = arrExp[looper].toString();

        if (isNumeric(opItem) || isVar(opItem)) {
            expStack.push(opItem);
        } else if (isOperator(opItem)) {
            while (opStack.length) {
                stackItem = opStack.pop()!.toString();
                if ((opItem === '√' && stackItem === '√' && _precedence[stackItem] > _precedence[opItem]) ||
                    ((opItem !== '√' || stackItem !== '√') && _precedence[stackItem] >= _precedence[opItem])) {
                    expStack.push(stackItem);
                } else {
                    opStack.push(stackItem);
                    break;
                }
            }
            opStack.push(opItem);
        } else if (isBracket(opItem)) {
            if (opItem === '(') {
                opStack.push(opItem);
            } else {
                while (opStack.length) {
                    stackItem = opStack.pop()!.toString();
                    if (stackItem !== '(') {
                        expStack.push(stackItem);
                    } else {
                        break;
                    }
                }
            }
        }
    }
    return expStack;
}

/**
 * 处理表达式生成波兰式(前缀表达式)
 * @param exp 
 * @returns 
 */
export function expToPn(exp:string):string[]|null{
    let _precedence:{ [key: string]: number;} = {'√':99, '^':98, '/': 2, '*': 2, '%': 2, '-': 1, '+': 1, '#': 0};
    let arrExp:Array<String>|null = splitExp(exp),
    expStack:string[] = [], opStack:string[] = [], opItem:string, stackItem:string;
    if (arrExp == null) {
        return null;
    }
    arrExp.unshift('#');
    for (let looper = arrExp.length - 1; looper >= 0; looper--) {
        opItem = arrExp[looper].toString();

        if (isNumeric(opItem) || isVar(opItem)) {
            expStack.push(opItem);
        } else if (isOperator(opItem)) {
            while (opStack.length) {
                stackItem = opStack.pop()!.toString();
                if ((opItem === '√' && stackItem === '√' && _precedence[stackItem] > _precedence[opItem]) ||
                    ((opItem !== '√' || stackItem !== '√') && _precedence[stackItem] >= _precedence[opItem])) {
                    expStack.push(stackItem);
                } else {
                    opStack.push(stackItem);
                    break;
                }
            }
            opStack.push(opItem);
        } else if (isBracket(opItem)) {
            if (opItem === ')') {
                opStack.push(opItem);
            } else {
                while (opStack.length) {
                    stackItem = opStack.pop()!.toString();
                    if (stackItem !== ')') {
                        expStack.push(stackItem);
                    } else {
                        break;
                    }
                }
            }
        }
    }
    return expStack;
}

/**
 * 条件表达式生成逆波兰式
 * @param exp 
 * @returns 
 */
export function condExpToRpn(exp:string):string[]|null{
    let _precedence:{ [key: string]: number;} = {'√':99, '^':98, '!':90, '/':5, '*':5, '%':5, '-':3, '+':3, '>':2, '<':2, '&eq;':2, '&ne;':2, '&le;':2, '&ge;':2, 'or':1, 'and':1, '#':0};
    let arrExp:Array<String>|null = splitCondExp(exp),
    expStack:string[] = [], opStack:string[] = [], opItem:string, stackItem:string;
    console.log(arrExp);
    if (arrExp == null) {
        return null;
    }
    arrExp = arrExp.concat('#');
    for (var looper = 0; looper < arrExp.length; looper++) {
        opItem = arrExp[looper].toString();

        if (isNumeric(opItem) || isVar(opItem)) {
            expStack.push(opItem);
        } else if (isOperator(opItem)) {
            while (opStack.length) {
                stackItem = opStack.pop()!.toString();
                if ((opItem === '√' && stackItem === '√' && _precedence[stackItem] > _precedence[opItem]) ||
                    ((opItem !== '√' || stackItem !== '√') && _precedence[stackItem] >= _precedence[opItem])) {
                    expStack.push(stackItem);
                } else {
                    opStack.push(stackItem);
                    break;
                }
            }
            opStack.push(opItem);
        } else if (isBracket(opItem)) {
            if (opItem === '(') {
                opStack.push(opItem);
            } else {
                while (opStack.length) {
                    stackItem = opStack.pop()!.toString();
                    if (stackItem !== '(') {
                        expStack.push(stackItem);
                    } else {
                        break;
                    }
                }
            }
        }
    }
    return expStack;
}

/**
 * 条件表达式生成波兰式
 * @param exp 
 * @returns 
 */
export function condExpToPn(exp:string):string[]|null{
    exp = exp.replace('>=', '&ge;').replace('<=', '&le;').replace('!=', '&ne;').replace('==', '&eq;');
    let _precedence:{ [key: string]: number;} = {'√':99, '^':98, '!':90, '/':5, '*':5, '%':5, '-':3, '+':3, '>':2, '<':2, '&eq;':2, '&ne;':2, '&le;':2, '&ge;':2, 'or':1, 'and':1, '#':0};
    let arrExp:Array<String>|null = splitCondExp(exp),
    expStack:string[] = [], opStack:string[] = [], opItem:string, stackItem:string;
    if (arrExp == null) {
        return null;
    }
    arrExp.unshift('#');
    for (var looper = arrExp.length - 1; looper >= 0; looper--) {
        opItem = arrExp[looper].toString();

        if (isNumeric(opItem) || isVar(opItem)) {
            expStack.push(opItem);
        } else if (isOperator(opItem)) {
            while (opStack.length) {
                stackItem = opStack.pop()!.toString();
                if ((opItem === '√' && stackItem === '√' && _precedence[stackItem] > _precedence[opItem]) ||
                    ((opItem !== '√' || stackItem !== '√') && _precedence[stackItem] >= _precedence[opItem])) {
                    expStack.push(stackItem);
                } else {
                    opStack.push(stackItem);
                    break;
                }
            }
            opStack.push(opItem);
        } else if (isBracket(opItem)) {
            if (opItem === ')') {
                opStack.push(opItem);
            } else {
                while (opStack.length) {
                    stackItem = opStack.pop()!.toString();
                    if (stackItem !== ')') {
                        expStack.push(stackItem);
                    } else {
                        break;
                    }
                }
            }
        }
    }
    return expStack;
}

/**
 * 解析表达式，生成原始数组
 * @param exp 
 * @returns 
 */
export function analyzeExp(exp:string):string[]|null {
    let b:boolean = /^(-?[√!]?(-?\d+\.\d+|-?\d+|-?\{\d\})\s?[+\-*\/^%]?\s*)+if\s+[\w\W]*\s+else\s+(-?[√!]?(-?\d+\.\d+|-?\d+|-?\{\d\})\s*[+\-*\/^%]?\s*)+$/.test(exp);
    if(!b) {    //非三目运算
        let pnexp = expToPn(exp);
        return pnexp ? pnexp.reverse() : null;
    }else{
        let segStack:string[] = []
        let posStr:string = exp.substring(0, exp.indexOf('if'));
        let conditionStr:string = exp.substring(exp.indexOf("if")+2, exp.indexOf("else"));
        let negStr:string = exp.substring(exp.indexOf('else') + 4);
        if(!posStr || !conditionStr || !negStr){
            return null;
        }
        segStack.unshift('if');
        let pnexp = condExpToPn(conditionStr);
        if(!pnexp){
            return null;
        }
        segStack = segStack.concat(pnexp.reverse());

        pnexp = expToPn(posStr);
        if(!pnexp){
            return null;
        }
        segStack = segStack.concat(pnexp.reverse());

        pnexp = expToPn(negStr);
        if(!pnexp){
            return null;
        }
        segStack = segStack.concat(pnexp.reverse());
        return segStack;
    }
}

/**
 * 转换原始数组中的符号
 * @param pn 
 * @returns 
 */
export function transformToExp(pn:string[]):number[]{
    let rtnExp:number[] = [];
    if(!pn){
        return rtnExp;
    }
    for(let item of pn){
        if(item == 'if'){
            rtnExp.push(OpCode.OPCODE_IF);
        }else if(isNumeric(item)){
            rtnExp.push(OpCode.OPCODE_CONST);
            rtnExp.push(Number(item));
        }else if(isVar(item)){
            rtnExp.push(OpCode.OPCODE_VAR);
            let idx:string = item.substring(1, item.lastIndexOf('\}'));
            rtnExp.push(Number(idx));
        }else if(isOperator(item)){
            rtnExp.push(OpCodeDict[item]);
        }
    }
    return rtnExp;
}

export function prepareExp(exp:string):number[]|null{
    if(exp){
        let tmpexp:string[] = analyzeExp(exp)!;
        console.log(tmpexp);
        let rtn:number[] = transformToExp(tmpexp);
        console.log(rtn);
        return rtn;
    }
    return null;
}

export function splitExp(exp:string):Array<String>|null {
    exp = exp.replace(/[a-zA-Z]/g, '').replace(/([\d%!])\-(\d)/g, '$1 - $2').replace(/([+\-\*\/^])\-(\d)/g, '$1 -$2');
    return (/^[+*\/!^%]|\d\(|[\d\)]√|![\d\(]|%%|[+\-*\/^]{2,}|[+\-*\/√^]$/.test(exp)) ?
        null : exp.match(/(-?(?:\d+\.?\d*|-?\.\d*))|(\{-?\d+\})|[()+\-*\/√!^%]/gi);
}

export function splitCondExp(exp:string):Array<String>|null {
    return exp.match(/(-?(?:\d+\.?\d*|-?\.\d*))|(\{-?\d+\})|[()+\-*\/√!^%\<\>]|\&ne;|\&eq;|\&ge;|\&le;|or|and/gi);
}

export function isNumeric(exp:string):boolean{
    // return !isNaN(Number(exp));
    return /^-?\d+\.\d+$|^-?\d+$/.test(exp);
}

export function isBracket(exp:string):boolean{
    return /^[\(\)]$/.test(exp);
}

export function isVar(exp:string):boolean{
    return /^\{-?\d+\}$/.test(exp);
}

export function isUnaryOperator(exp:string):boolean {
    return /^[√%!]$/.test(exp);
}

export function isOperator(exp:string):boolean {
    return /^[√%!^\/\*\-\+#]|\>|\<|\&ne;|\&eq;|\&ge;|\&le;|or|and$/.test(exp);
}