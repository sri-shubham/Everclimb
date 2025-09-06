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
    // Ice and mud become more common as level increases
    iceBoost: clamp(2 + 0.8*L, 0, 25),
    mudBoost: clamp(0 + 0.4*L, 0, 12),
    
    // Movement costs increase gradually
    baseCost: clamp(1 + 0.015*L, 1, 2.5),
    mudCost:  clamp(3 + 0.05*L, 3, 5.5),
    slipCostExtra: clamp(0 + 0.015*L, 0, 0.8),
    
    // Stamina budget decreases but not too aggressively
    staminaBudget: clamp(110 - 0.8*L, 65, 110),
    
    // Food value decreases slowly
    foodValue: clamp(25 - 0.2*L, 12, 25),
    
    // Food rate decreases slowly to make higher levels harder
    foodRate: clamp(0.65 - 0.008*L, 0.3, 0.65),
    
    // Boots duration decreases with level
    bootsSteps: clamp(7 - Math.floor(L/8), 3, 7),
    bootsRate: clamp(0.2 - 0.003*L, 0.05, 0.2),
    
    // More coins at higher levels as reward
    coinsMin: 10 + Math.floor(L/6),
    coinsMax: 16 + Math.floor(L/4),
    
    // Fewer gentle top rows at higher levels
    gentleTopRows: clamp(3 - Math.floor(L/10), 0, 3),
  };
}
