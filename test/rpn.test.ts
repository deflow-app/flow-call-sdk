import {isNumeric, expToPn, expToRpn, condExpToRpn, condExpToPn, analyzeExp, transformToExp, prepareExp} from '../src/utils/rpn';

describe('rpn test', () => {
    it('analyze conditional expression', (async () => {
        const str:string = "√2*{1} if {1} < 10 or {1} > 100 else {2} ^ 2-90";
        // const str:string="{2}*10 if {1}<19 or ({1}>=23 and !({2}+10<3) or ({3}>2 and {3}<10)) and ({1}!=24 and {2}<3 or ({3}>2 and {3}<10)) else {1}+5";
        prepareExp(str);
    }),300000);

    it('analyze expression', (async () => {
        let exp:string='((√4+{1}+113)+{2}+(1+12))*8+12%{3}';
        // let tmpexp:string[] = analyzeExp(exp)!;
        // console.log(tmpexp);
        // let finalArr:Number[] = transformToExp(tmpexp)!;
        // console.log(finalArr);
        prepareExp(exp);
    }),300000);
});