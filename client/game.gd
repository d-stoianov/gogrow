class_name Game
extends Node2D

@onready var _socket_timer: Timer = $"SocketTimer"
@onready var _menu: Menu = $"CanvasLayer/Menu"
@onready var _world: World = %"World"
@onready var _remote_world: World = %"RemoteWorld"

var _server_url = "ws://164.92.192.186"
var _socket = WebSocketPeer.new()
var _session_name = ""
var _player_id = ""
var _socket_state = WebSocketPeer.State.STATE_CLOSED

func _ready() -> void:
	_socket.connect_to_url(_server_url)


func _physics_process(delta: float) -> void:
	_socket.poll()
	var socket_state = _socket.get_ready_state()
	if _socket_state != socket_state:
		_socket_state = socket_state
		_on_socket_state_updated(_socket_state)

	if socket_state == WebSocketPeer.State.STATE_OPEN:
		while _socket.get_available_packet_count():
			_response_process(_socket.get_packet().get_string_from_utf8())


func _response_process(response: String) -> void:
	if response == null or response.length() == 0:
		printerr("Empty response received")
		return

	var data = JSON.parse_string(response)
	if data == null or data is not Dictionary:
		printerr("Not a valid JSON dictionary: " + response)
		return

	if data.get("error") != null:
		printerr("Error: " + JSON.stringify(data.get("error")))
		return

	var messageType = data.get("messageType")
	var body = data.get("body")
	if messageType == null or body == null or body is not Dictionary:
		printerr("Missing messageType or body in " + response)
		return

	match messageType:
		"SESSION_CREATED", "SESSION_CONNECTED":
			var sessionId = body.get("sessionId")
			var playerId = body.get("playerId")
			_on_session_connected(sessionId, playerId)
		"GAME_INIT":
			_on_remote_game_init(body)
		"TICK":
			_on_remote_tick(body)
		_:
			printerr("Unknown messageType in " + response)


func _on_session_connected(session_name, player_id) -> void:
	_menu.hide()
	_player_id = player_id
	if session_name != null and session_name.length() > 0:
		_session_name = session_name
	_socket_timer.start()
	print("Connection confirmed %s/%s" % [_session_name, _player_id])


func _on_remote_game_init(body: Dictionary) -> void:
	_remote_world.visible = true
	print("Game is initialized")


func _on_remote_tick(body: Dictionary) -> void:
	_remote_world.apply_packet(body)


func _on_socket_state_updated(state) -> void:
	_menu.set_connectivity(state == WebSocketPeer.State.STATE_OPEN)


func _on_socket_timer_timeout() -> void:
	if _socket.get_ready_state() == WebSocketPeer.State.STATE_CONNECTING:
		return
	elif _socket.get_ready_state() == WebSocketPeer.State.STATE_CLOSED:
		return
	elif _socket.get_ready_state() == WebSocketPeer.State.STATE_CLOSING:
		return

	var isDiff = true
	var world_packet = _world.get_next_packet(isDiff)

	if world_packet.keys().size() == 0:
		return

	world_packet.set("isDiff", isDiff)

	var packet = {
		"sessionName": _session_name,
		"messageType": "TICK",
		"playerId": _player_id,
		"body": world_packet
	}
	var data = JSON.stringify(packet)
	print("Sending " + JSON.stringify(packet))
	_socket.send_text(data)


func _on_menu_session_connect(session_name: String) -> void:
	var packet: Dictionary
	packet = {
		"messageType": "SESSION_CONNECT",
		"body": {
			"sessionName": session_name
		}
	}
	_session_name = session_name
	_socket.send_text(JSON.stringify(packet))
