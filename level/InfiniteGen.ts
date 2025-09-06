import { idx, computeGrid } from "../engine/Grid";
import { difficultyFor, Diff } from "./Difficulty";

export enum T { DIRT=0, STONE=1, MUD=2, ICE=3 }
export enum I { NONE=0, BOOTS=1, FOOD=2, COIN=3 }

export type Chunk = {
  cols:number; rows:number; hexSize:number;
  terrain: Uint8Array; item: Uint8Array;
  seed:number; level:number; entranceQ:number;
};

const band=(r:number,rows:number)=> r/(rows-1)>0.75?0:r/(rows-1)>0.5?1:r/(rows-1)>0.25?2:3;
const clamp=(x:number,a:number,b:number)=>x<a?a:x>b?b:x;

function rng32(seed:number){ let t=seed>>>0; return ()=>{ t+=0x6D2B79F5;
  let x=Math.imul(t^(t>>>15),1|t); x^=x+Math.imul(x^(x>>>7),61|x);
  return ((x^(x>>>14))>>>0)/4294967296; }; }
export const hash32=(a:number,b:number)=>{ let x=(a^(b+0x9e3779b9)+(a<<6)+(a>>>2))>>>0;
  x^=x<<13; x^=x>>>17; x^=x<<5; return x>>>0; };

function pickTerrain(b:number, rnd:()=>number, d:Diff):T{
  const w = [
    [45,35,15, 5],
    [30,40,15,15],
    [20,35,10,35],
    [10,25, 5,60],
  ][b].slice();
  w[2]+=d.mudBoost; w[3]+=d.iceBoost;
  const s=w[0]+w[1]+w[2]+w[3];
  let roll=rnd()*s;
  for (let t=0;t<4;t++){ roll-=w[t]; if (roll<=0) return t as T; }
  return T.STONE;
}

const NEG=-32768;

function nextStates(q:number,r:number,cols:number,rows:number,terrain:Uint8Array,item:Uint8Array,st:number,bt:number,d:Diff){
  const res: Array<{q:number;r:number;st:number;bt:number}> = [];
  if (st<=0) return res;

  const step=(dq:number,dr:number)=>{
    let qq=q+dq, rr=r+dr; if (rr<0||rr>=rows||qq<0||qq>=cols) return;
    let id=(rr*cols+qq), terr=terrain[id] as T;
    let cost = terr===T.MUD? d.mudCost : d.baseCost;
    let nst=st-cost, nbt=Math.max(0,bt-1);

    if (terr===T.ICE && nbt===0){ // slip one more up-diagonal
      const sqq=qq+dq, srr=rr+dr;
      if (srr>=0&&srr<rows&&sqq>=0&&sqq<cols){
        qq=sqq; rr=srr; id=rr*cols+sqq; terr=terrain[id] as T;
        nst -= (terr===T.MUD? d.mudCost : d.baseCost) + d.slipCostExtra;
      }
    }
    const it=item[id] as I;
    if (it===I.FOOD) nst += d.foodValue;
    else if (it===I.BOOTS) nbt = d.bootsSteps;

    if (nst>0) res.push({q:qq,r:rr,st:nst,bt:nbt});
  };
  step(0,-1); step(1,-1);
  return res;
}

function ensureReachable(chunk:{cols:number;rows:number;terrain:Uint8Array;item:Uint8Array}, rnd:()=>number, d:Diff){
  const {cols,rows,terrain,item}=chunk;
  const bestSt = new Int16Array(cols*rows).fill(NEG);
  const bestBt = new Int16Array(cols*rows).fill(NEG);
  const upd=(id:number,st:number,bt:number)=>{
    if (bt>0){ if (st>bestBt[id]) bestBt[id]=st; }
    else { if (st>bestSt[id]) bestSt[id]=st; }
  };
  // seed bottom
  for (let q=0;q<cols;q++){
    const id=(rows-1)*cols+q;
    let st = d.staminaBudget - (terrain[id]===T.MUD? d.mudCost : d.baseCost);
    let bt = 0;
    if (item[id]===I.FOOD) st += d.foodValue;
    else if (item[id]===I.BOOTS) bt = d.bootsSteps;
    if (st>0){ if (bt>0) bestBt[id]=st; else bestSt[id]=st; }
  }
  // propagate row by row; fix if dead
  for (let r=rows-1; r>0; r--){
    for (let q=0;q<cols;q++){
      const id=r*cols+q;
      const a=bestSt[id], b=bestBt[id];
      if (a>NEG) for (const s of nextStates(q,r,cols,rows,terrain,item,a,0,d)) upd(s.r*cols+s.q, s.st, s.bt);
      if (b>NEG) for (const s of nextStates(q,r,cols,rows,terrain,item,b,d.bootsSteps,d)) upd(s.r*cols+s.q, s.st, s.bt);
    }
    // dead row? stealth repair then re-run this frontier
    let alive=false;
    for (let q=0;q<cols;q++){
      const id=(r-1)*cols+q;
      if (bestSt[id]>NEG || bestBt[id]>NEG){ alive=true; break; }
    }
    if (!alive){
      const qPick = clamp(Math.floor(cols*0.3 + rnd()*cols*0.4), 0, cols-1);
      const id=(r-1)*cols+qPick;
      if (Math.random() < d.foodRate){
        if (item[id]===I.NONE) item[id] = (Math.random()<d.bootsRate ? I.BOOTS : I.FOOD);
        else if (terrain[id]===T.ICE || terrain[id]===T.MUD) terrain[id]=T.STONE;
      } else {
        if (terrain[id]===T.ICE || terrain[id]===T.MUD) terrain[id]=T.STONE; else item[id]=I.FOOD;
      }
      for (let rr=r-1; rr>=0; rr--) for (let qq=0; qq<cols; qq++){
        bestSt[rr*cols+qq]=NEG; bestBt[rr*cols+qq]=NEG;
      }
      r++; // redo frontier
    }
  }
}

export function generateChunkInfinite(opts:{
  hexSize:number; seed:number; level:number; W?:number; H?:number; stitchEntranceQ?:number;
}): Chunk {
  const {hexSize,seed,level,W=640,H=480,stitchEntranceQ} = opts;
  const rnd = rng32(seed);
  const d = difficultyFor(level);
  const {cols,rows} = computeGrid(hexSize,W,H);

  const terrain = new Uint8Array(cols*rows);
  const item = new Uint8Array(cols*rows);

  for (let r=0;r<rows;r++){
    const b=band(r,rows);
    for (let q=0;q<cols;q++){
      terrain[idx(q,r,cols)] = pickTerrain(b, rnd, d);
    }
  }

  // coins
  let coins=0, target = d.coinsMin + Math.floor(rnd()*(d.coinsMax-d.coinsMin+1));
  for (let r=rows-1;r>=0 && coins<target; r--)
    for (let q=0;q<cols && coins<target; q++)
      if (Math.random()<0.14 && item[idx(q,r,cols)]===I.NONE){ item[idx(q,r,cols)]=I.COIN; coins++; }

  // gentle top rows
  for (let r=0; r<d.gentleTopRows; r++)
    for (let q=0;q<cols;q++){
      const id=idx(q,r,cols);
      if (terrain[id]===T.MUD && Math.random()<0.5) terrain[id]=T.STONE;
    }

  ensureReachable({cols,rows,terrain,item}, rnd, d);

  const entranceQ = stitchEntranceQ ?? clamp(Math.floor(cols*0.5 + (rnd()-0.5)*4), 0, cols-1);
  return { cols, rows, hexSize, terrain, item, seed, level, entranceQ };
}

export function generateNextChunkInfinite(prev: Chunk): Chunk {
  const nextSeed = hash32(prev.seed, prev.level+1);
  const entrance = Math.max(0, Math.min(prev.cols-1, prev.entranceQ + (Math.random()<0.5?0:(Math.random()<0.5?-1:1))));
  return generateChunkInfinite({ hexSize: prev.hexSize, seed: nextSeed, level: prev.level+1, stitchEntranceQ: entrance });
}
