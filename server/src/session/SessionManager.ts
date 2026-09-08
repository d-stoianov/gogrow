import { MessageType, type Packet, send, sendError } from '@/protocol/Packet.ts'
import { Session } from '@/session/Session.ts'
import { Player } from '@/player/Player.ts'

class SessionManager {
    private sessions: Session[] = []

    public connectToSession(socket: WebSocket, sessionName: string) {
        const player = new Player(socket)
        let session = this.findSessionByName(sessionName)

        // if session doesn't exist - create one
        if (!session) {
            session = new Session(2, player, sessionName)
            this.sessions.push(session)
            console.log(`Player ${player.id} created session ${session.name}`)

            send(socket, {
                messageType: MessageType.SESSION_CREATED,
                body: { sessionId: session.id, playerId: player.id },
            })
        } else {
            // if session exists - check if it's full
            if (session.isFull) {
                sendError(socket, 'Session is full')
                return
            }

            // connect user to the session
            session.joinSession(player)
            console.log(`Player ${player.id} joined session ${session.name}`)

            send(socket, {
                messageType: MessageType.SESSION_CONNECTED,
                body: { sessionId: session.id, playerId: player.id },
            })

            // if session filled all the players - start game
            if (session.isFull) {
                const seed = crypto.getRandomValues(new Uint32Array(1))[0]

                // broadcast it to all the players in the session
                for (const p of session.getPlayers()) {
                    send(p.socket, {
                        messageType: MessageType.GAME_INIT,
                        body: { seed: String(seed) },
                    })
                }
            }
        }

        const joined = session

        // attach the close listener
        socket.addEventListener('close', () => {
            console.log(
                `Player ${player.id} disconnected from session ${joined.name}`,
            )
            joined.leaveSession(player.id)

            // remove session if empty
            if (joined.isEmpty) {
                this.sessions = this.sessions.filter((s) => s !== joined)
                console.log(`Session ${joined.name} removed (empty)`)
            }
        }, { once: true })
    }

    public leaveSession(socket: WebSocket, playerId: string) {
        const session = this.findSessionByPlayerId(playerId)

        // check if this session exists
        if (!session) {
            sendError(socket, 'Player is not connected to any session')
            return
        }

        session.leaveSession(playerId)
        console.log(`Player ${playerId} left session ${session.name}`)
        console.log(
            `Session ${session.name} players: ${
                session.getPlayers().map((p) => p.id).join(', ')
            }`,
        )

        send(socket, { messageType: MessageType.SESSION_LEFT })

        // remove session if empty
        if (session.isEmpty) {
            this.sessions = this.sessions.filter((s) => s !== session)
            console.log(`Session ${session.name} removed (empty)`)
        }
    }

    // broadcasting game state updates to all the other players in the session
    public tickOthers(socket: WebSocket, packet: Packet) {
        const session = this.findSessionByPlayerId(packet.playerId as string)

        // check if this session exists
        if (!session) {
            sendError(socket, 'Player is not connected to any session')
            return
        }

        const playersToBroadcast = session
            .getPlayers()
            .filter((p) => p.id !== packet.playerId)

        for (const p of playersToBroadcast) {
            send(p.socket, packet)
        }
    }

    // find session by session name
    private findSessionByName(name: string): Session | undefined {
        return this.sessions.find((s) => s.name === name)
    }

    private findSessionByPlayerId(playerId: string): Session | undefined {
        return this.sessions.find((s) => {
            return s.getPlayers().some((p) => p.id === playerId)
        })
    }
}

export { SessionManager }
