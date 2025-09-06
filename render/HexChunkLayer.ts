import Phaser from "phaser";
import { axialToPixel } from "../engine/Grid";
import { Chunk, T, I } from "../level/InfiniteGen";

export class HexChunkLayer extends Phaser.GameObjects.Container {
  private chunk: Chunk;
  private chunkOriginY: number;

  constructor(scene: Phaser.Scene, chunk: Chunk, originY: number) {
    super(scene);
    this.chunk = chunk;
    this.chunkOriginY = originY;
    this.setDepth(1);
    this.draw();
  }

  private drawHex(x:number,y:number,size:number,color:number) {
    const g = this.scene.add.graphics();
    g.fillStyle(color, 1);
    g.beginPath();
    for (let i=0;i<6;i++){
      const a = Math.PI/180*(60*i-30);
      const px = x + size*Math.cos(a);
      const py = y + size*Math.sin(a);
      if (i===0) g.moveTo(px,py); else g.lineTo(px,py);
    }
    g.closePath(); g.fillPath();
    this.add(g);
  }

  private colorFor(t:T) {
    switch (t) {
      case T.DIRT: return 0x8b5a2b;
      case T.STONE: return 0x808080;
      case T.MUD: return 0x5a3c2b;
      case T.ICE: return 0x77c7ff;
    }
  }

  private drawItem(x:number,y:number,size:number,i:I){
    if (i===I.NONE) return;
    const txt = this.scene.add.text(x, y, i===I.FOOD?'F':i===I.BOOTS?'B':'$', { fontSize: '10px', color:'#000' }).setOrigin(0.5);
    this.add(txt);
  }

  draw() {
    const { cols, rows, hexSize, terrain, item } = this.chunk;
    for (let r=0;r<rows;r++){
      for (let q=0;q<cols;q++){
        const { x, y } = axialToPixel(q, r, hexSize);
        const screenX = x + 16; // padding
        const screenY = this.chunkOriginY + y;
        this.drawHex(screenX, screenY, hexSize-1, this.colorFor(terrain[r*cols+q] as T));
        this.drawItem(screenX, screenY, hexSize, item[r*cols+q] as I);
      }
    }
  }

  moveBy(dy:number){ this.y += dy; }
  getTopY(){ return this.y + this.chunkOriginY; }       // top row local origin
  getBottomY(){ return this.y + this.chunkOriginY + (this.chunk.rows-1)*1.5*this.chunk.hexSize; }
}
