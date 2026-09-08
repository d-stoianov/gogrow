import { Packet } from '@/Packet'
import { WebSocket } from 'ws'
import { Session } from '@/session/Session'
import { Player } from '@/player/Player'

class SessionManager {
    private sessions: Session[] = []

    public connectToSession(ws: WebSocket, sessionName: string) {
        const player = new Player(ws)
        let session = this.findSessionByName(sessionName)

        // if session doesn't exist - create one
        if (!session) {
            session = new Session(2, player, sessionName)
            this.sessions.push(session)
            console.log(`Player ${player.id} created session ${session.name}`)

            ws.send(
                JSON.stringify({
                    messageType: 'SESSION_CREATED',
                    body: { playerId: player.id },
                } as Packet)
            )
        } else {
            // if session exists - check if it's full
            if (session.isFull) {
                ws.send(
                    JSON.stringify({
                        error: { message: `Session is full` },
                    } as Packet)
                )
                return
            }

            // connect user to the session
            session.joinSession(player)
            console.log(`Player ${player.id} joined session ${session.name}`)

            ws.send(
                JSON.stringify({
                    messageType: 'SESSION_CONNECTED',
                    body: { playerId: player.id },
                } as Packet)
            )

            // if session filled all the players - start game
            if (session.isFull) {
                const random = crypto
                    .getRandomValues(new Uint32Array(1))
                    .toString()

                // broadcast it to all the players in the session
                session.getPlayers().forEach((p) => {
                    p.ws.send(
                        JSON.stringify({
                            messageType: 'GAME_INIT',
                            body: { seed: random },
                        } as Packet)
                    )
                })
            }
        }

        // attach the close listener
        ws.on('close', () => {
            console.log(
                `Player ${player.id} disconnected from session ${session.name}`
            )
            session.leaveSession(player.id)

            // remove session if empty
            if (session.isEmpty) {
                this.sessions = this.sessions.filter((s) => s !== session)
                console.log(`Session ${session.name} removed (empty)`)
            }
        })
    }

    public leaveSession(ws: WebSocket, playerId: string) {
        const session = this.findSessionByPlayerId(playerId)

        // check if this session exists
        if (!session) {
            ws.send(
                JSON.stringify({
                    error: {
                        message: `Player is not connected to any session`,
                    },
                } as Packet)
            )
            return
        }

        session.leaveSession(playerId)
        console.log(`Player ${playerId} left session ${session.name}`)

        console.log(`Session ${session.name} players: ${session.getPlayers()}`)

        // connect user to the session
        ws.send(
            JSON.stringify({
                messageType: 'SESSION_LEFT',
            } as Packet)
        )
    }

    // broadcasting game state updates to all the other players in the session
    public tickOthers(ws: WebSocket, packet: Packet) {
        const session = this.findSessionByPlayerId(packet.playerId as string)

        // check if this session exists
        if (!session) {
            ws.send(
                JSON.stringify({
                    error: {
                        message: `Player is not connected to any session`,
                    },
                } as Packet)
            )
            return
        }

        const playersToBroadcast = session
            .getPlayers()
            .filter((p) => p.id !== packet.playerId)

        playersToBroadcast.forEach((p) => {
            p.ws.send(JSON.stringify(packet as Packet))
        })
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
