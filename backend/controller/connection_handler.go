package controller

import (
	"context"
	"errors"
	"io"
	"log"

	"github.com/coder/websocket"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// Session holds the per-connection state passed to message handlers.
// Add fields here as the application grows (e.g. user info, DB handle).
type Session struct {
	Ctx        context.Context
	WriteQueue chan<- []byte
}

// connectionHandler upgrades an HTTP request to a WebSocket connection,
// spins up a writer goroutine, and reads messages in a loop.
func (ctrl *Controller) connectionHandler(ginCtx *gin.Context) {

	//* Upgrade connection to WebSocket.
	// Allow all origins for development and testing with web clients.
	c, err := websocket.Accept(ginCtx.Writer, ginCtx.Request, &websocket.AcceptOptions{
		InsecureSkipVerify: true,
	})

	if err != nil {
		log.Printf("Failed to accept websocket connection: %v", err)
		return
	}
	defer c.Close(websocket.StatusNormalClosure, "connection closed")

	ctrl.logger.Info("Client connected!", zap.String("remoteAddress", ginCtx.Request.RemoteAddr))

	// Create a context for the session.
	ctx, cancel := context.WithCancel(ginCtx.Request.Context())
	defer cancel()

	// Channel to serialize writes to the websocket connection.
	// github.com/coder/websocket does not allow concurrent writes.
	writeQueue := make(chan []byte, 16)

	// Writer goroutine that processes the queue and sends messages to the client.
	go func() {
		defer cancel() // cancel context if write fails or queue is closed
		for {
			select {
			case <-ctx.Done():
				return
			case msg, ok := <-writeQueue:
				if !ok {
					return
				}
				// Send the message as Text.
				err := c.Write(ctx, websocket.MessageText, msg)
				if err != nil {
					log.Printf("Write error: %v", err)
					return
				}
			}
		}
	}()

	// Build the session object for message handlers.
	session := &Session{
		Ctx:        ctx,
		WriteQueue: writeQueue,
	}

	// Main loop reads messages from client and dispatches to onMessage.
	for {
		messageType, reader, err := c.Reader(ctx)
		if err != nil {
			if errors.Is(err, io.EOF) {
				log.Println("Client closed connection gracefully (EOF)")
			} else if status := websocket.CloseStatus(err); status != -1 {
				log.Printf("Client closed connection with status: %v", status)
			} else {
				log.Printf("Read error: %v", err)
			}
			break
		}

		// Read the full message from reader
		msgBytes, err := io.ReadAll(reader)
		if err != nil {
			log.Printf("Error reading message: %v", err)
			break
		}

		// Dispatch to the onMessage handler
		if messageType == websocket.MessageText || messageType == websocket.MessageBinary {
			ctrl.onMessage(session, messageType, msgBytes)
		}
	}

	ctrl.logger.Info("Client disconnected!", zap.String("remoteAddress", ginCtx.Request.RemoteAddr))
}
