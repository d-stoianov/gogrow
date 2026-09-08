import { PORT } from '@/config.ts'
import { MessageType, type Packet, sendError } from '@/protocol/Packet.ts'
import { SessionManager } from '@/session/SessionManager.ts'

const sessionManager = new SessionManager()

function routePacket(socket: WebSocket, packet: Packet): void {
    switch (packet.messageType) {
        case MessageType.SESSION_CONNECT: {
            const sessionName = packet.body?.sessionName
            if (typeof sessionName !== 'string' || sessionName.length === 0) {
                sendError(socket, 'SESSION_CONNECT requires body.sessionName')
                return
            }
            sessionManager.connectToSession(socket, sessionName)
            return
        }
        case MessageType.SESSION_LEAVE: {
            if (!packet.playerId) {
                sendError(socket, 'SESSION_LEAVE requires playerId')
                return
            }
            sessionManager.leaveSession(socket, packet.playerId)
            return
        }
        case MessageType.TICK: {
            if (!packet.playerId) {
                sendError(socket, 'TICK requires playerId')
                return
            }
            sessionManager.tickOthers(socket, packet)
            return
        }
        default:
            sendError(
                socket,
                'Unrecognizable combination of message type and body',
            )
            return
    }
}

function handleMessage(socket: WebSocket, raw: string): void {
    let packet: Packet
    try {
        packet = JSON.parse(raw) as Packet
    } catch {
        sendError(socket, 'Malformed JSON')
        return
    }

    if (packet === null || typeof packet !== 'object') {
        sendError(socket, 'Packet must be a JSON object')
        return
    }

    console.log('PACKET: ', packet)

    routePacket(socket, packet)
}

Deno.serve({
    port: PORT,
    onListen: ({ port }) => {
        console.log(`Websocket server is listening on port: ${port}`)
    },
}, (req) => {
    if (req.headers.get('upgrade')?.toLowerCase() !== 'websocket') {
        return new Response('GoGrow websocket server', {
            status: 200,
            headers: { 'content-type': 'text/plain' },
        })
    }

    const { socket, response } = Deno.upgradeWebSocket(req)

    socket.addEventListener('message', (event) => {
        if (typeof event.data !== 'string') {
            sendError(socket, 'Only text frames are supported')
            return
        }
        handleMessage(socket, event.data)
    })

    // without this the socket's error event goes unhandled
    socket.addEventListener('error', (event) => {
        console.error('SOCKET ERROR: ', event)
    })

    return response
})
