package main

import (
	"british-auction-backend/internal/api"
	"british-auction-backend/internal/config"
	"british-auction-backend/internal/repository"
	"british-auction-backend/internal/repository/postgres"
	"british-auction-backend/internal/websocket"
	"british-auction-backend/internal/worker"
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/hibiken/asynq"
)

func main() {
	// 1. Init Config
	config.InitEnv()

	// 2. Init Database
	postgres.InitDB()
	defer postgres.CloseDB()

	// 3. Init Queue Service and Worker Server
	queueSvc := worker.NewQueueService()
	
	// Start Asynq worker server in background
	workerSrv := asynq.NewServer(
		asynq.RedisClientOpt{Addr: config.AppEnv.RedisURL},
		asynq.Config{
			Concurrency: 10,
		},
	)
	
	wsHub := websocket.NewHub()
	rfqRepo := repository.NewRfqRepository()
	closureHandler := worker.NewClosureHandler(rfqRepo, wsHub, queueSvc)
	
	mux := asynq.NewServeMux()
	mux.HandleFunc(worker.TypeAuctionClosure, closureHandler.ProcessTask)
	
	go func() {
		if err := workerSrv.Run(mux); err != nil {
			log.Fatalf("could not start worker server: %v", err)
		}
	}()

	// 4. Setup HTTP Router
	router := api.SetupRouter(wsHub, queueSvc)

	// 5. Start HTTP Server
	addr := fmt.Sprintf(":%d", config.AppEnv.Port)
	srv := &http.Server{
		Addr:    addr,
		Handler: router,
	}

	go func() {
		log.Printf("Server starting on %s in %s mode\n", addr, config.AppEnv.NodeEnv)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %s\n", err)
		}
	}()

	// 6. Graceful Shutdown
	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	// Fix the unreachable failsafe timer bug identified in the audit
	// We give the server 10 seconds to shut down gracefully before forcing it
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown: ", err)
	}

	workerSrv.Shutdown()
	log.Println("Server exiting")
}
