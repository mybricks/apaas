const { SnowFlake } = require('gen-uniqueid');
const SNOW_FLAKE = new SnowFlake({ workerId: process.env.WorkerId == undefined ? 1 : process.env.WorkerId });

export function genMainIndexOfDB() {
  return SNOW_FLAKE.NextId();
}