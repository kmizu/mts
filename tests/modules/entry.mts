import { double as timesTwo, triple } from "./math.mts";
import { quadruple } from "./util.mts";

let aliasResult = timesTwo(3);
let tripleResult = triple(2);
let quadResult = quadruple(2);
let summary = { alias: aliasResult, triple: tripleResult, quad: quadResult };
summary;
