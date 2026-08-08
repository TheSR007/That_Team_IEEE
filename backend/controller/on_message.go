package controller

import (
	"encoding/json"
	"log"

	"github.com/coder/websocket"
	"go.uber.org/zap"
)

// ──────────────────────────────────────────────────────────────────────────────
// Core handler
// ──────────────────────────────────────────────────────────────────────────────

// onMessage is called for every incoming WebSocket message.
// It expects the payload to be a filename in the form "uuid.<ext>" that was
// previously saved by fileInputHandler into the uploads/ directory.
//
// Flow:
//  1. Validate the filename and check the file exists on disk.
//  2. Upload the file to the Gemini File API.
//  3. Call GenerateContent with the uploaded file + system/user prompts.
//  4. Send the response text back to the client via the WebSocket.
func (ctrl *Controller) onMessage(session *Session, msgType websocket.MessageType, payload []byte) {
	if msgType == websocket.MessageText {
		ctrl.logger.Info("Text Message received!", zap.String("msgBody", string(payload)))
	} else {
		ctrl.logger.Info("Binary Message received!")
	}

	sendReply(session, "Hello!")
}

// sendReply sends a text message to the client via the session write queue.
func sendReply(session *Session, text string) {
	reply := []byte(text)
	select {
	case session.WriteQueue <- reply:
	case <-session.Ctx.Done():
		return
	default:
		// Write queue full, dropping message
	}
}

// sendError sends a JSON-formatted error message to the client.
func sendError(session *Session, msg string) {
	log.Printf("Error: %s", msg)

	// Marshal rather than interpolate: msg can contain a client-supplied filename.
	errMsg, err := json.Marshal(map[string]string{"error": msg})
	if err != nil {
		errMsg = []byte(`{"error":"internal error"}`)
	}
	select {
	case session.WriteQueue <- errMsg:
	case <-session.Ctx.Done():
		return
	default:
		// Write queue full, dropping error message
	}
}
