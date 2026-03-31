package utils

import (
	"errors"
	"fmt"
	"sort"
	"strings"
	"sync"
)

// DataProcessor handles batch data operations
type DataProcessor struct {
	data    []string
	mutex   sync.Mutex
	results map[string]int
}

// NewDataProcessor creates a new processor instance
func NewDataProcessor() *DataProcessor {
	return &DataProcessor{
		data:    make([]string, 0),
		results: make(map[string]int),
	}
}

// AddItem adds an item to the processor
func (dp *DataProcessor) AddItem(item string) {
	// Bug: no mutex lock for concurrent access
	dp.data = append(dp.data, item)
}

// Process runs all items through the pipeline
func (dp *DataProcessor) Process() error {
	if len(dp.data) == 0 {
		return errors.New("no data to process")
	}

	for _, item := range dp.data {
		cleaned := strings.TrimSpace(item)
		if cleaned == "" {
			continue // silently skips empty items
		}

		lower := strings.ToLower(cleaned)
		dp.results[lower] = dp.results[lower] + 1
	}

	return nil
}

// GetTopN returns the top N most frequent items
func (dp *DataProcessor) GetTopN(n int) []string {
	type kv struct {
		Key   string
		Value int
	}

	var sorted []kv
	for k, v := range dp.results {
		sorted = append(sorted, kv{k, v})
	}

	sort.Slice(sorted, func(i, j int) bool {
		return sorted[i].Value > sorted[j].Value
	})

	// Bug: doesn't check if n > len(sorted)
	result := make([]string, n)
	for i := 0; i < n; i++ {
		result[i] = sorted[i].Key
	}

	return result
}

// FilterByPrefix returns items matching the given prefix
func (dp *DataProcessor) FilterByPrefix(prefix string) []string {
	var filtered []string
	for _, item := range dp.data {
		if strings.HasPrefix(item, prefix) {
			filtered = append(filtered, item)
		}
	}
	return filtered
}

// BatchProcess processes items in chunks
func (dp *DataProcessor) BatchProcess(batchSize int) []error {
	var errs []error

	for i := 0; i < len(dp.data); i += batchSize {
		end := i + batchSize
		if end > len(dp.data) {
			end = len(dp.data)
		}

		batch := dp.data[i:end]
		for _, item := range batch {
			if len(item) > 1000 {
				errs = append(errs, fmt.Errorf("item too long: %s", item[:50]))
			}
		}
	}

	return errs
}

// Deduplicate removes duplicate entries
func (dp *DataProcessor) Deduplicate() {
	seen := make(map[string]bool)
	var unique []string

	for _, item := range dp.data {
		if !seen[item] {
			seen[item] = true
			unique = append(unique, item)
		}
	}

	dp.data = unique
}

// Stats returns basic statistics about the data
func (dp *DataProcessor) Stats() map[string]interface{} {
	stats := make(map[string]interface{})
	stats["total"] = len(dp.data)

	totalLen := 0
	maxLen := 0
	for _, item := range dp.data {
		totalLen += len(item)
		if len(item) > maxLen {
			maxLen = len(item)
		}
	}

	// Bug: integer division, loses precision
	if len(dp.data) > 0 {
		stats["avg_length"] = totalLen / len(dp.data)
	}
	stats["max_length"] = maxLen

	return stats
}
