class_name Player
extends CharacterBody2D

@export var speed = 1000.0
@export var is_remote = true

var _last_packet = {}

func _physics_process(delta: float) -> void:
	if is_remote:
		return

	var dy = Input.get_action_strength("move_down") - Input.get_action_strength("move_up")
	var dx = Input.get_action_strength("move_right") - Input.get_action_strength("move_left")
	velocity = Vector2(dx, dy).normalized() * speed
	move_and_slide()


func get_next_packet(diff: bool) -> Dictionary:
	var packet = {}

	if !diff || _last_packet.get("position") == null || _last_packet["position"] != position:
		packet["position"] = position

	if packet.keys().size() != 0:
		_last_packet = packet

	return packet


func apply_packet(packet: Dictionary) -> void:
	position = str_to_var("Vector2" + packet.get("position"))
