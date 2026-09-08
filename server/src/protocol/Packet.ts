enum MessageType {
    SESSION_CONNECT = 'SESSION_CONNECT',
    SESSION_CREATED = 'SESSION_CREATED',
    SESSION_CONNECTED = 'SESSION_CONNECTED',
    SESSION_LEAVE = 'SESSION_LEAVE',
    SESSION_LEFT = 'SESSION_LEFT',
    GAME_INIT = 'GAME_INIT',
    TICK = 'TICK',
}

type Packet = {
    messageType?: MessageType
    playerId?: string
    body?: Record<string, unknown>
    error?: {
        message?: string
        code?: number
    }
}

// `send` on a standard WebSocket throws when the socket is no longer OPEN,
// unlike the `ws` package, which silently dropped the frame.
function send(socket: WebSocket, packet: Packet): void {
    if (socket.readyState !== WebSocket.OPEN) {
        return
    }
    socket.send(JSON.stringify(packet))
}

function sendError(socket: WebSocket, message: string): void {
    send(socket, { error: { message } })
}

export { MessageType, type Packet, send, sendError }
