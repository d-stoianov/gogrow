import { Player } from '@/player/Player.ts'

enum SessionStatus {
    ACTIVE,
    WAITING_FOR_PLAYERS,
}

class Session {
    public readonly id: string
    public readonly name: string

    private size: number
    private players: Player[] = []
    private status: SessionStatus = SessionStatus.WAITING_FOR_PLAYERS

    constructor(size = 2, creator: Player, name: string) {
        this.id = crypto.randomUUID()
        this.size = size
        this.name = name

        this.joinSession(creator)
    }

    get isFull() {
        return this.size === this.players.length
    }

    get isEmpty() {
        return this.players.length === 0
    }

    public getStatus() {
        return this.status
    }

    public getPlayers() {
        return this.players
    }

    public joinSession(player: Player) {
        if (this.isFull) {
            throw new Error('Session is full')
        }
        this.players.push(player)
        this.status = this.isFull
            ? SessionStatus.ACTIVE
            : SessionStatus.WAITING_FOR_PLAYERS
    }

    public leaveSession(playerId: string): boolean {
        const index = this.players.findIndex((p) => p.id === playerId)
        if (index === -1) {
            return false
        }

        this.players = [
            ...this.players.slice(0, index),
            ...this.players.slice(index + 1),
        ]
        this.status = SessionStatus.WAITING_FOR_PLAYERS
        return true
    }
}

export { Session, SessionStatus }
