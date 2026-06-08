package api

import (
	"british-auction-backend/internal/api/handlers"
	"british-auction-backend/internal/api/middleware"
	"british-auction-backend/internal/domain"
	"british-auction-backend/internal/repository"
	"british-auction-backend/internal/service"
	"british-auction-backend/internal/websocket"
	"british-auction-backend/internal/worker"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
	gorillaWs "github.com/gorilla/websocket"
)

var upgrader = gorillaWs.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// Allow all origins for websocket in development
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func SetupRouter(wsHub *websocket.HubImpl, queueSvc worker.QueueService) *chi.Mux {
	r := chi.NewRouter()

	// Global middleware
	r.Use(chiMiddleware.Logger)
	r.Use(chiMiddleware.Recoverer)
	r.Use(middleware.CORS)

	// Repositories
	userRepo := repository.NewUserRepository()
	rfqRepo := repository.NewRfqRepository()
	bidRepo := repository.NewBidRepository()

	// Services
	authSvc := service.NewAuthService(userRepo)
	auctionSvc := service.NewAuctionService()
	rfqSvc := service.NewRfqService(rfqRepo, wsHub, queueSvc)
	bidSvc := service.NewBidService(bidRepo, rfqRepo, auctionSvc, wsHub, queueSvc)

	// Handlers
	authHandler := handlers.NewAuthHandler(authSvc)
	rfqHandler := handlers.NewRfqHandler(rfqSvc)
	bidHandler := handlers.NewBidHandler(bidSvc)

	// Routes
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	r.Route("/auth", func(r chi.Router) {
		r.Post("/register", authHandler.Register)
		r.Post("/login", authHandler.Login)
		r.Post("/google", authHandler.GoogleLogin)

		r.With(middleware.AuthMiddleware).Get("/me", authHandler.Me)
	})

	r.Route("/rfqs", func(r chi.Router) {
		r.Use(middleware.AuthMiddleware)
		
		r.Get("/", rfqHandler.GetAllRfqs)
		r.Get("/{id}", rfqHandler.GetRfq)
		
		r.With(middleware.RequireRole(domain.RoleBuyer)).Post("/", rfqHandler.CreateRfq)
		r.With(middleware.RequireRole(domain.RoleBuyer)).Post("/{id}/early-close", rfqHandler.EarlyClose)
		
		r.With(middleware.RequireRole(domain.RoleSupplier)).Post("/{id}/bids", bidHandler.PlaceBid)
	})

	// WebSocket Route (Note: authentication could be added here by passing token in query string)
	r.Get("/socket", func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println("WebSocket upgrade failed:", err)
			return
		}
		
		client := websocket.NewClient(wsHub, conn)
		
		go client.WritePump()
		go client.ReadPump()
	})

	return r
}
