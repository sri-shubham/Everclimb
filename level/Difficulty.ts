export type Diff = {
  iceBoost:number; mudBoost:number;
  baseCost:number; mudCost:number; slipCostExtra:number;
  staminaBudget:number; foodValue:number; foodRate:number;
  bootsSteps:number; bootsRate:number;
  coinsMin:number; coinsMax:number; gentleTopRows:number;
};

const clamp=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x));

export function difficultyFor(level:number): Diff {
  const L=Math.max(1,level);
  return {
    iceBoost: clamp(3+0.9*L,0,28),
    mudBoost: clamp(0+0.3*L,0,10),
    baseCost: clamp(1+0.02*L,1,3),
    mudCost:  clamp(3+0.06*L,3,6),
    slipCostExtra: clamp(0+0.02*L,0,1),
    staminaBudget: clamp(105-1.0*L,60,105),
    foodValue: clamp(22-0.25*L,10,22),
    foodRate: clamp(0.62-0.01*L,0.25,0.62),
    bootsSteps: clamp(6-Math.floor(L/6),2,6),
    bootsRate: clamp(0.18-0.004*L,0.04,0.18),
    coinsMin: 12+Math.floor(L/8),
    coinsMax: 18+Math.floor(L/6),
    gentleTopRows: clamp(2-Math.floor(L/12),0,2),
  };
}
