package model

import "encoding/json"

type EventType int

const (
	Unknown EventType = iota
	JoinedLobbyEvent
	LocationUpdateEvent
)

type Event struct {
	Type    EventType       `json:"type"`
	Payload json.RawMessage `json:"payload"`
}
