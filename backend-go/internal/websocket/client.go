package websocket

import (
	"encoding/json"
	"log"
	"time"

	"github.com/gorilla/websocket"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 512
)

type Client struct {
	hub  *HubImpl
	conn *websocket.Conn
	send chan *Message
	// Keep track of which rooms this client is in to unregister cleanly
	rooms map[uint]bool
}

type ClientMessage struct {
	Event   string      `json:"event"`
	Payload interface{} `json:"payload"`
}

func NewClient(hub *HubImpl, conn *websocket.Conn) *Client {
	return &Client{
		hub:   hub,
		conn:  conn,
		send:  make(chan *Message, 256),
		rooms: make(map[uint]bool),
	}
}

func (c *Client) ReadPump() {
	defer func() {
		c.cleanup()
		c.conn.Close()
	}()
	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error { c.conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}

		var clientMsg ClientMessage
		if err := json.Unmarshal(message, &clientMsg); err != nil {
			log.Printf("Invalid message format: %v", err)
			continue
		}

		// Handle events (Fixing the join_rfq bug identified in audit)
		if clientMsg.Event == "join_rfq" || clientMsg.Event == "join-rfq" {
			rfqID, ok := ExtractRoomID(clientMsg.Payload)
			if ok {
				c.hub.register <- &ClientRegistration{Client: c, RfqID: rfqID}
				c.rooms[rfqID] = true
			}
		} else if clientMsg.Event == "leave_rfq" || clientMsg.Event == "leave-rfq" {
			rfqID, ok := ExtractRoomID(clientMsg.Payload)
			if ok {
				c.hub.unregister <- &ClientRegistration{Client: c, RfqID: rfqID}
				delete(c.rooms, rfqID)
			}
		}
	}
}

func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()
	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// The hub closed the channel.
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			c.conn.WriteJSON(message)

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (c *Client) cleanup() {
	for rfqID := range c.rooms {
		c.hub.unregister <- &ClientRegistration{Client: c, RfqID: rfqID}
	}
}
