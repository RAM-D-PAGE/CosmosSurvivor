export class FloatingText {
    constructor(x, y, text, color) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;

        this.velocity = { x: (Math.random() - 0.5) * 50, y: -50 };
        this.lifeTime = 0.8;
        this.life = this.lifeTime;
        this.alpha = 1;
        this.markedForDeletion = false;
        this.fontSize = 20;
    }

    update(dt) {
        this.x += this.velocity.x * dt;
        this.y += this.velocity.y * dt;

        this.life -= dt;
        this.alpha = this.life / this.lifeTime;

        if (this.life <= 0) this.markedForDeletion = true;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.font = `bold ${this.fontSize}px Arial`;
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.strokeText(this.text, this.x, this.y);
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}
