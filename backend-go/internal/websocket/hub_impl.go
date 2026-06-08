package websocket

import (
	"british-auction-backend/internal/config"
	"british-auction-backend/internal/domain"
	"context"
	"encoding/json"
	"log"
	"strconv"
	"sync"

	"github.com/redis/go-redis/v9"
)

type HubImpl struct {
	// Registered clients mapped by RFQ ID
	rooms map[uint]map[*Client]bool

	// Inbound messages from clients
	broadcast chan *Message

	// Register requests from clients
	register chan *ClientRegistration

	// Unregister requests from clients
	unregister chan *ClientRegistration

	// Redis client for Pub/Sub
	redisClient *redis.Client

	mu sync.RWMutex
}

type ClientRegistration struct {
	Client *Client
	RfqID  uint
}

type Message struct {
	RfqID   uint        `json:"rfqId"`
	Event   string      `json:"event"`
	Payload interface{} `json:"payload"`
}

func NewHub() *HubImpl {
	rdb := redis.NewClient(&redis.Options{
		Addr: config.AppEnv.RedisURL,
	})

	h := &HubImpl{
		rooms:       make(map[uint]map[*Client]bool),
		broadcast:   make(chan *Message),
		register:    make(chan *ClientRegistration),
		unregister:  make(chan *ClientRegistration),
		redisClient: rdb,
	}

	go h.run()
	go h.listenRedis()

	return h
}

func (h *HubImpl) run() {
	for {
		select {
		case reg := <-h.register:
			h.mu.Lock()
			if h.rooms[reg.RfqID] == nil {
				h.rooms[reg.RfqID] = make(map[*Client]bool)
			}
			h.rooms[reg.RfqID][reg.Client] = true
			h.mu.Unlock()
			log.Printf("Client joined room %d", reg.RfqID)

		case unreg := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.rooms[unreg.RfqID]; ok {
				if _, ok := h.rooms[unreg.RfqID][unreg.Client]; ok {
					delete(h.rooms[unreg.RfqID], unreg.Client)
					if len(h.rooms[unreg.RfqID]) == 0 {
						delete(h.rooms, unreg.RfqID)
					}
					log.Printf("Client left room %d", unreg.RfqID)
				}
			}
			h.mu.Unlock()

		case msg := <-h.broadcast:
			h.mu.RLock()
			clients := h.rooms[msg.RfqID]
			for client := range clients {
				select {
				case client.send <- msg:
				default:
					close(client.send)
					delete(clients, client)
				}
			}
			h.mu.RUnlock()
		}
	}
}

// listenRedis subscribes to a global Redis channel to receive messages from other instances
func (h *HubImpl) listenRedis() {
	ctx := context.Background()
	pubsub := h.redisClient.Subscribe(ctx, "rfq_events")
	defer pubsub.Close()

	ch := pubsub.Channel()
	for msg := range ch {
		var m Message
		if err := json.Unmarshal([]byte(msg.Payload), &m); err != nil {
			log.Printf("Error unmarshalling redis message: %v", err)
			continue
		}
		// Send to local broadcast channel
		h.broadcast <- &m
	}
}

func (h *HubImpl) publishToRedis(msg *Message) {
	ctx := context.Background()
	payload, err := json.Marshal(msg)
	if err != nil {
		log.Printf("Error marshalling message for redis: %v", err)
		return
	}
	err = h.redisClient.Publish(ctx, "rfq_events", payload).Err()
	if err != nil {
		log.Printf("Error publishing to redis: %v", err)
	}
}

func (h *HubImpl) BroadcastToRfq(rfqID uint, event string, payload interface{}) {
	msg := &Message{
		RfqID:   rfqID,
		Event:   event,
		Payload: payload,
	}
	// Publish to Redis so all instances get it and broadcast to their connected clients
	h.publishToRedis(msg)
}

func (h *HubImpl) BroadcastBidPlaced(rfqID uint, bid *domain.Bid) {
	h.BroadcastToRfq(rfqID, "BID_PLACED", bid)
}

func (h *HubImpl) BroadcastAuctionExtended(rfqID uint, newClose string) {
	h.BroadcastToRfq(rfqID, "AUCTION_EXTENDED", map[string]string{
		"new_close": newClose,
	})
}

func (h *HubImpl) BroadcastAuctionClosed(rfqID uint) {
	h.BroadcastToRfq(rfqID, "AUCTION_CLOSED", map[string]interface{}{})
}

// Utility to extract room ID from a join message
func ExtractRoomID(payload interface{}) (uint, bool) {
	switch v := payload.(type) {
	case string:
		id, err := strconv.ParseUint(v, 10, 32)
		if err == nil {
			return uint(id), true
		}
	case float64:
		return uint(v), true
	}
	return 0, false
}
