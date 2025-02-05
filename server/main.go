package main

import (
	"fmt"
	"github.com/gorilla/websocket"
	"log"
	"net/http"
	"sync"
	"tron/internal/model"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

var clients = make(map[*websocket.Conn]bool)
var broadcast = make(chan model.Event)
var mutex = &sync.Mutex{}

func handleConnections(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal(err)
	}
	defer ws.Close()

	mutex.Lock()
	clients[ws] = true
	mutex.Unlock()

	for {
		var event model.Event
		err := ws.ReadJSON(&event)
		if err != nil {
			log.Printf("error: %v", err)
			mutex.Lock()
			delete(clients, ws)
			mutex.Unlock()
			break
		}
		if event.Type == model.JoinedLobbyEvent {
			fmt.Println("Someone joined the lobby")
			broadcast <- event
		}
	}
}

func handleMessages() {
	for {
		event := <-broadcast
		mutex.Lock()
		for client := range clients {
			err := client.WriteJSON(event)
			if err != nil {
				log.Printf("error: %v", err)
				client.Close() // Does this kill the client?
				delete(clients, client)
			}
		}
		mutex.Unlock()
	}
}

func main() {
	http.HandleFunc("/ws", handleConnections)
	go handleMessages()

	log.Println("Server started on :42069")
	err := http.ListenAndServe(":42069", nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
