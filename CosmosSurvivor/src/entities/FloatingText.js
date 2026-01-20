export class FloatingText {
    constructor(x, y, text, color) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;

        // Physics: Pop up and fall down
        this.velocity = { x: (Math.random() - 0.5) * 60, y: -150 - Math.random() * 50 };
        this.gravity = 500;

        this.lifeTime = 0.8;
        this.life = this.lifeTime;
        this.alpha = 1;
        this.markedForDeletion = false;

        // Dynamic Size
        this.fontSize = 24;
        if (typeof text === 'string' && (text.includes('!') || text.length > 3)) {
            this.fontSize = 32; // Critical or message
            this.velocity.y -= 50; // Pop higher
        }
    }

    update(dt) {
        this.velocity.y += this.gravity * dt;
        this.x += this.velocity.x * dt;
        this.y += this.velocity.y * dt;

        this.life -= dt;
        this.alpha = Math.pow(this.life / this.lifeTime, 0.5); // Non-linear fade

        if (this.life <= 0) this.markedForDeletion = true;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.font = `bold ${this.fontSize}px "Rajdhani", Arial`;
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4;

        ctx.strokeText(this.text, this.x, this.y);
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}
