package main

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

type Pipeline struct {
	ID              string `json:"id"`
	UserID          string `json:"user_id"`
	IsActive        bool   `json:"is_active"`
	MessageTemplate string `json:"message_template"`
}

type Destination struct {
	ID        string                 `json:"id"`
	Channel   string                 `json:"channel"`
	IsEnabled bool                   `json:"is_enabled"`
	Config    map[string]interface{} `json:"config"`
}

type Profile struct {
	PlanTier string `json:"plan_tier"`
}

var (
	supabaseURL string
	supabaseKey string
	httpClient  = &http.Client{Timeout: 10 * time.Second}
	tierLimits  = map[string]int{
		"free":  100,
		"pro":   10000,
		"scale": 100000,
	}
)

func main() {
	_ = godotenv.Load()

	supabaseURL = os.Getenv("SUPABASE_URL")
	supabaseKey = os.Getenv("SUPABASE_SERVICE_ROLE_KEY")

	if supabaseURL == "" || supabaseKey == "" {
		log.Fatal("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env")
	}

	r := gin.Default()
	r.POST("/v1/hook/:token", handleWebhook)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("⚡ Chethavni Ingestion Engine running on :%s", port)
	r.Run(":" + port)
}

func handleWebhook(c *gin.Context) {
	start := time.Now()
	token := c.Param("token")

	var rawPayload map[string]interface{}
	if err := c.ShouldBindJSON(&rawPayload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON payload"})
		return
	}

	// 1. Fetch pipeline
	url := fmt.Sprintf("%s/rest/v1/pipelines?pipeline_token=eq.%s&select=id,user_id,is_active,message_template", supabaseURL, token)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create request"})
		return
	}
	req.Header.Set("apikey", supabaseKey)
	req.Header.Set("Authorization", "Bearer "+supabaseKey)

	resp, err := httpClient.Do(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database lookup failed"})
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var pipelines []Pipeline
	if err := json.Unmarshal(body, &pipelines); err != nil || len(pipelines) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pipeline not found"})
		return
	}

	pipeline := pipelines[0]
	if !pipeline.IsActive {
		c.JSON(http.StatusForbidden, gin.H{"error": "Pipeline paused"})
		return
	}

	// 2. Plan Tier and Daily Quota Check
	profURL := fmt.Sprintf("%s/rest/v1/profiles?id=eq.%s&select=plan_tier", supabaseURL, pipeline.UserID)
	profReq, _ := http.NewRequest("GET", profURL, nil)
	profReq.Header.Set("apikey", supabaseKey)
	profReq.Header.Set("Authorization", "Bearer "+supabaseKey)

	var profiles []Profile
	if pResp, err := httpClient.Do(profReq); err == nil {
		defer pResp.Body.Close()
		pBody, _ := io.ReadAll(pResp.Body)
		_ = json.Unmarshal(pBody, &profiles)
	}

	userTier := "free"
	if len(profiles) > 0 && profiles[0].PlanTier != "" {
		userTier = strings.ToLower(profiles[0].PlanTier)
	}

	limit := tierLimits[userTier]
	if limit == 0 {
		limit = 100
	}

	today := time.Now().UTC().Format("2006-01-02")
	usageURL := fmt.Sprintf("%s/rest/v1/daily_usage?user_id=eq.%s&usage_date=eq.%s&select=request_count", supabaseURL, pipeline.UserID, today)
	usageReq, _ := http.NewRequest("GET", usageURL, nil)
	usageReq.Header.Set("apikey", supabaseKey)
	usageReq.Header.Set("Authorization", "Bearer "+supabaseKey)

	var usageRecords []map[string]interface{}
	if uResp, err := httpClient.Do(usageReq); err == nil {
		defer uResp.Body.Close()
		uBody, _ := io.ReadAll(uResp.Body)
		_ = json.Unmarshal(uBody, &usageRecords)
	}

	if len(usageRecords) > 0 {
		if countVal, ok := usageRecords[0]["request_count"].(float64); ok && int(countVal) >= limit {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":       "Daily quota exceeded",
				"limit":       limit,
				"current":     int(countVal),
				"upgrade_url": "https://chethavni.com/pricing",
			})
			return
		}
	}

	renderedMsg := renderTemplate(pipeline.MessageTemplate, rawPayload)

	// 3. Fetch destinations
	destURL := fmt.Sprintf("%s/rest/v1/destinations?pipeline_id=eq.%s&is_enabled=eq.true&select=id,channel,is_enabled,config", supabaseURL, pipeline.ID)
	destReq, _ := http.NewRequest("GET", destURL, nil)
	destReq.Header.Set("apikey", supabaseKey)
	destReq.Header.Set("Authorization", "Bearer "+supabaseKey)

	var destinations []Destination
	if destResp, destErr := httpClient.Do(destReq); destErr == nil {
		defer destResp.Body.Close()
		destBody, _ := io.ReadAll(destResp.Body)
		_ = json.Unmarshal(destBody, &destinations)
	}

	// 4. Background Fanout Worker
	clientIP := c.ClientIP()
	go func(pipeID, uID, msg, ip string, payload map[string]interface{}, dests []Destination, startTime time.Time) {
		status := "success"

		for _, dest := range dests {
			ch := strings.ToLower(strings.TrimSpace(dest.Channel))
			var dispatchErr error

			switch ch {
			case "discord":
				if webhookURL, ok := dest.Config["webhook_url"].(string); ok {
					dispatchErr = sendDiscordAlert(webhookURL, msg)
				}
			case "telegram":
				botToken, _ := dest.Config["bot_token"].(string)
				chatID, _ := dest.Config["chat_id"].(string)
				if botToken != "" && chatID != "" {
					dispatchErr = sendTelegramAlert(botToken, chatID, msg)
				}
			case "slack":
				if slackWebhook, ok := dest.Config["webhook_url"].(string); ok {
					dispatchErr = sendSlackAlert(slackWebhook, msg)
				}
			case "email":
    apiKey, _ := dest.Config["api_key"].(string)
    to, _ := dest.Config["to"].(string)
    subject, _ := dest.Config["subject"].(string)
    log.Printf("📧 Resend attempt: apiKey_set=%t, to=%s", apiKey != "", to)
    if apiKey != "" && to != "" {
        if err := sendResendEmail(apiKey, to, subject, msg); err != nil {
            log.Printf("❌ Resend Delivery Error: %v", err)
            status = "partial_failure"
        } else {
            log.Printf("✅ Email successfully sent via Resend to %s", to)
        }
    } else {
        log.Printf("⚠️ Email skipped: apiKey or to is missing in config")
    }
			case "webhook":
				endpoint, _ := dest.Config["endpoint_url"].(string)
				secret, _ := dest.Config["secret"].(string)
				if endpoint != "" {
					dispatchErr = sendCustomWebhook(endpoint, secret, payload)
				}
			default:
				log.Printf("⚠️ Unknown channel: %s", dest.Channel)
			}

			if dispatchErr != nil {
				log.Printf("⚠️ Error routing to %s: %v", ch, dispatchErr)
				status = "partial_failure"
			}
		}

		duration := int(time.Since(startTime).Milliseconds())

		// Increment daily usage count
		rpcBody, _ := json.Marshal(map[string]string{"p_user_id": uID})
		rpcReq, _ := http.NewRequest("POST", supabaseURL+"/rest/v1/rpc/increment_user_usage", bytes.NewBuffer(rpcBody))
		rpcReq.Header.Set("apikey", supabaseKey)
		rpcReq.Header.Set("Authorization", "Bearer "+supabaseKey)
		rpcReq.Header.Set("Content-Type", "application/json")
		_, _ = httpClient.Do(rpcReq)

		// Record Execution Log
		logEntry := map[string]interface{}{
			"pipeline_id":           pipeID,
			"status":                status,
			"source_ip":             ip,
			"raw_payload":           payload,
			"rendered_message":      msg,
			"execution_duration_ms": duration,
		}
		logPayload, _ := json.Marshal(logEntry)
		logReq, _ := http.NewRequest("POST", supabaseURL+"/rest/v1/execution_logs", bytes.NewBuffer(logPayload))
		logReq.Header.Set("apikey", supabaseKey)
		logReq.Header.Set("Authorization", "Bearer "+supabaseKey)
		logReq.Header.Set("Content-Type", "application/json")
		logReq.Header.Set("Prefer", "return=minimal")
		_, _ = httpClient.Do(logReq)
	}(pipeline.ID, pipeline.UserID, renderedMsg, clientIP, rawPayload, destinations, start)

	// Immediate response to caller
	c.JSON(http.StatusOK, gin.H{
		"status":      "received",
		"pipeline_id": pipeline.ID,
		"latency_ms":  time.Since(start).Milliseconds(),
	})
}

func renderTemplate(tmpl string, payload map[string]interface{}) string {
	rawJSON, _ := json.MarshalIndent(payload, "", "  ")
	if strings.TrimSpace(tmpl) == "" {
		return fmt.Sprintf("```json\n%s\n```", string(rawJSON))
	}
	out := tmpl
	out = strings.ReplaceAll(out, "{{payload}}", fmt.Sprintf("```json\n%s\n```", string(rawJSON)))
	for k, v := range payload {
		placeholder := fmt.Sprintf("{{%s}}", k)
		out = strings.ReplaceAll(out, placeholder, fmt.Sprintf("%v", v))
	}
	return out
}

// Destination Handlers

func sendDiscordAlert(webhookURL, content string) error {
	body, _ := json.Marshal(map[string]string{"content": content})
	resp, err := http.Post(webhookURL, "application/json", bytes.NewBuffer(body))
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	return nil
}

func sendTelegramAlert(botToken, chatID, text string) error {
	apiURL := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", botToken)
	cleanText := strings.ReplaceAll(text, "**", "")
	payload := map[string]string{
		"chat_id": chatID,
		"text":    cleanText,
	}
	body, _ := json.Marshal(payload)
	resp, err := http.Post(apiURL, "application/json", bytes.NewBuffer(body))
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("telegram status %d: %s", resp.StatusCode, string(respBody))
	}
	return nil
}

func sendSlackAlert(webhookURL, text string) error {
	body, _ := json.Marshal(map[string]string{"text": text})
	resp, err := http.Post(webhookURL, "application/json", bytes.NewBuffer(body))
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("slack status %d: %s", resp.StatusCode, string(respBody))
	}
	return nil
}

func sendResendEmail(apiKey, to, subject, content string) error {
	if strings.TrimSpace(subject) == "" {
		subject = "Chethavni Alert Notification"
	}

	reqData := map[string]interface{}{
		"from":    "Chethavni Alerts <onboarding@resend.dev>",
		"to":      []string{strings.TrimSpace(to)},
		"subject": subject,
		"text":    content,
	}
	reqBytes, err := json.Marshal(reqData)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", "https://api.resend.com/emails", bytes.NewBuffer(reqBytes))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+strings.TrimSpace(apiKey))
	req.Header.Set("Content-Type", "application/json")

	resp, err := httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		return fmt.Errorf("resend status %d: %s", resp.StatusCode, string(respBody))
	}
	return nil
}

func sendCustomWebhook(targetURL, secret string, payload map[string]interface{}) error {
	jsonBytes, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", targetURL, bytes.NewBuffer(jsonBytes))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "Chethavni-Hook-Router/1.0")

	// Calculate HMAC signature if secret provided
	if secret != "" {
		h := hmac.New(sha256.New, []byte(secret))
		h.Write(jsonBytes)
		req.Header.Set("X-Chethavni-Signature", hex.EncodeToString(h.Sum(nil)))
	}

	resp, err := httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("downstream webhook returned status %d", resp.StatusCode)
	}
	return nil
}