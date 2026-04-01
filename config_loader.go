package main

import (
	"encoding/json"
	"fmt"
	"os"
	"strconv"
)

// Config holds application configuration.
type Config struct {
	Host     string `json:"host"`
	Port     int    `json:"port"`
	Debug    bool   `json:"debug"`
	LogLevel string `json:"log_level"`
}

// DefaultConfig returns a Config with sensible defaults.
func DefaultConfig() Config {
	return Config{
		Host:     "0.0.0.0",
		Port:     8080,
		Debug:    false,
		LogLevel: "info",
	}
}

// LoadFromFile reads a JSON config file and merges it over defaults.
func LoadFromFile(path string) (Config, error) {
	cfg := DefaultConfig()
	f, err := os.Open(path)
	if err != nil {
		return cfg, fmt.Errorf("open config: %w", err)
	}
	defer f.Close()
	if err := json.NewDecoder(f).Decode(&cfg); err != nil {
		return cfg, fmt.Errorf("decode config: %w", err)
	}
	return cfg, nil
}

// LoadFromEnv overrides config fields from environment variables.
func LoadFromEnv(cfg *Config) {
	if v := os.Getenv("APP_HOST"); v != "" {
		cfg.Host = v
	}
	if v := os.Getenv("APP_PORT"); v != "" {
		if p, err := strconv.Atoi(v); err == nil {
			cfg.Port = p
		}
	}
	if v := os.Getenv("APP_DEBUG"); v == "true" {
		cfg.Debug = true
	}
	if v := os.Getenv("APP_LOG_LEVEL"); v != "" {
		cfg.LogLevel = v
	}
}
