class_name Menu
extends Control

signal session_connect(session_id)

@onready var _session_id_text: TextEdit = %SessionIdText
@onready var _connect_button: Button = %ConnectButton


func set_connectivity(enabled) -> void:
	_session_id_text.editable = enabled
	_connect_button.disabled = _session_id_text.text.length() == 0
	if OS.get_cmdline_args().has("--quick-connect"):
		_session_id_text.text = "TSTSSN"
		_connect_button.disabled = false
		_on_connect_button_pressed()


func _on_session_id_text_text_changed() -> void:
	_connect_button.disabled = _session_id_text.text.length() == 0


func _on_connect_button_pressed() -> void:
	session_connect.emit(_session_id_text.text)
