import { Player } from '@/player/Player'
import { v4 as uuidv4 } from 'uuid'

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
        this.id = uuidv4()
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
    }

    public leaveSession(playerId: string) {
        const indexToRemove = this.players.findIndex((p) => p.id === playerId)

        // mutate players array
        this.players = [
            ...this.players.slice(0, indexToRemove),
            ...this.players.slice(indexToRemove + 1),
        ]
    }
}

export { Session }
