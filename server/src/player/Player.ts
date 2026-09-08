import { v4 as uuidv4 } from 'uuid'
import { WebSocket } from 'ws'

class Player {
    public readonly id: string
    public readonly ws: WebSocket

    // public readonly name: string = ''

    constructor(ws: WebSocket) {
        this.id = uuidv4()
        this.ws = ws
    }
}

export { Player }
