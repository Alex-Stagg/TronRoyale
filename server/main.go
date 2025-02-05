package main

import (
	"encoding/json"
	"fmt"
	"github.com/gorilla/websocket"
	"log"
	"log/slog"
	"net/http"
	"os"
	"sync"
	"tron/internal/model"
)

type Coordinates struct {
	X float64
	Y float64
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

var broadcast = make(chan model.Event)
var mutex = &sync.Mutex{}

var clients = make(map[*websocket.Conn]string)
var coordinatesList []Coordinates

// handleConnectionsHandler handles incoming WebSocket connections
func handleConnectionsHandler(logger *slog.Logger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ws, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Fatal(err)
		}
		defer ws.Close()

		for {
			var event model.Event
			err := ws.ReadJSON(&event)
			if err != nil {
				logger.Error("Error reading JSON.", "error", err)
				mutex.Lock()
				delete(clients, ws)
				mutex.Unlock()
				break
			}

			if err := event.Validate(); err != nil {
				logger.Error("Invalid event", "error", err, "event", event)
				continue
			}

			switch event.Type {
			case model.JoinedLobbyEvent:
				var payload model.JoinedLobbyPayload
				if err := json.Unmarshal(event.Payload, &payload); err != nil {
					logger.Error("Error unmarshalling payload", "error", err)
					continue
				}
				mutex.Lock()

				if _, exists := clients[ws]; exists {
					mutex.Unlock()
					_ = ws.WriteJSON(model.NewErrorResponse("Username already exists"))
					continue
				}

				clients[ws] = payload.Username
				mutex.Unlock()
				logger.Info("Someone joined the lobby", "username", payload.Username)
				broadcast <- event
			case model.LocationUpdateEvent:
				var payload model.LocationUpdatePayload
				if err := json.Unmarshal(event.Payload, &payload); err != nil {
					logger.Error("Error unmarshalling payload", "error", err)
					continue
				}
				mutex.Lock()
				coordinatesList = append(coordinatesList, Coordinates{X: payload.X, Y: payload.Y})
				mutex.Unlock()
				logger.Info("Location update", coordinatesList)
				logger.Info("Location update", "x", payload.X, "y", payload.Y)
				broadcast <- event
			default:
				logger.Warn("Unknown event type")
			}
		}
	}
}

func handleMessages(logger *slog.Logger) {
	for {
		fmt.Println("Waiting for event")
		event := <-broadcast
		mutex.Lock()
		for client := range clients {
			fmt.Println("Sending event")
			if err := client.WriteJSON(event); err != nil {
				slog.Error("error parsing JSON message", "error", err)
				client.Close() // Does this kill the client?
				delete(clients, client)
			}
		}
		mutex.Unlock()
	}
}

func main() {
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))

	http.HandleFunc("/ws", handleConnectionsHandler(logger))
	go handleMessages(logger)

	slog.Info("Server started on :42069")
	if err := http.ListenAndServe(":42069", nil); err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
