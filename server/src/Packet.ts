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

export { Packet }
