import {buildFixture} from '../booking-fixture/build.mjs';
const result=await buildFixture(process.env,{rental:true});
console.log(JSON.stringify({fixture:result.out,serverStarted:false,syntheticOnly:true}));
