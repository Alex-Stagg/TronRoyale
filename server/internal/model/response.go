package model

import "encoding/json"

type ResponseType string

const (
	UnknownResponse ResponseType = ""
	ErrorResponse   ResponseType = "error"
)

type Response struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

func NewErrorResponse(err string) *Response {
	payload := map[string]string{"error": err}
	payloadBytes, _ := json.Marshal(payload)
	return &Response{
		Type:    string(ErrorResponse),
		Payload: payloadBytes,
	}
}
