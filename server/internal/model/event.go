package model

import (
	"encoding/json"
	"fmt"
)

type Validator interface {
	Validate() error
}

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

func (e *Event) Validate() error {
	if e.Type == Unknown {
		return fmt.Errorf("event type is unknown")
	}
	if len(e.Payload) == 0 {
		return fmt.Errorf("payload is empty")
	}

	var payload Validator
	switch e.Type {
	case JoinedLobbyEvent:
		payload = &JoinedLobbyPayload{}
	case LocationUpdateEvent:
		payload = &LocationUpdatePayload{}
	default:
		return fmt.Errorf("unsupported event type")
	}

	if err := json.Unmarshal(e.Payload, &payload); err != nil {
		return fmt.Errorf("invalid payload: %v", err)
	}

	if err := payload.Validate(); err != nil {
		return fmt.Errorf("payload validation failed: %v", err)
	}

	return nil
}

type JoinedLobbyPayload struct {
	Username string `json:"username"`
	Color    string `json:"color"`
}

func (p *JoinedLobbyPayload) Validate() error {
	if p.Username == "" {
		return fmt.Errorf("username is required")
	}
	if p.Color == "" {
		return fmt.Errorf("color is required")
	}
	return nil
}

type LocationUpdatePayload struct {
	Username string  `json:"username"`
	X        float64 `json:"x"`
	Y        float64 `json:"y"`
}

func (p *LocationUpdatePayload) Validate() error {
	if p.Username == "" {
		return fmt.Errorf("username is required")
	}
	if p.X == 0 && p.Y == 0 {
		return fmt.Errorf("location coordinates are required")
	}
	return nil
}
