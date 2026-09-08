class Player {
    public readonly id: string
    public readonly socket: WebSocket

    constructor(socket: WebSocket) {
        this.id = crypto.randomUUID()
        this.socket = socket
    }
}

export { Player }
