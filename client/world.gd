class_name World
extends Node2D

@export var is_remote = true
@onready var _player: Player = $"Player"
@onready var _walls: StaticBody2D = $"Walls"

var _last_packet = { }

func _ready() -> void:
	if is_remote:
		_walls.queue_free()
	_player.is_remote = is_remote


func get_next_packet(diff: bool) -> Dictionary:
	var packet = { }
	var player_packet = _player.get_next_packet(diff)
	if player_packet.keys().size() > 0:
		packet.set("player", player_packet)

	_last_packet = packet
	return packet


func apply_packet(body: Dictionary):
	_player.apply_packet(body.get("player"))
