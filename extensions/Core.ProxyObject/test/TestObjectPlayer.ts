export default class TestObjectPlayer {
    name: string;
    private _health: number = 100;

    constructor(name: string) {
        this.name = name;
    }

    getHealth(): number {
        return this._health;
    }

    damage(amount: number): void {
        this._health = Math.max(0, this._health - amount);
    }

    heal(amount: number): void {
        this._health = Math.min(100, this._health + amount);
    }

    isDead(): boolean {
        return this._health <= 0;
    }
}
