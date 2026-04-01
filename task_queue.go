package main

import (
	"fmt"
	"sync"
	"time"
)

// Task represents a unit of work.
type Task struct {
	ID      int
	Payload string
}

// Result holds the outcome of a processed task.
type Result struct {
	TaskID  int
	Output  string
	Elapsed time.Duration
}

// WorkerPool processes tasks concurrently.
type WorkerPool struct {
	workers int
	jobs    chan Task
	results chan Result
	wg      sync.WaitGroup
}

func NewWorkerPool(workers, bufferSize int) *WorkerPool {
	return &WorkerPool{
		workers: workers,
		jobs:    make(chan Task, bufferSize),
		results: make(chan Result, bufferSize),
	}
}

func (wp *WorkerPool) Start() {
	for i := 0; i < wp.workers; i++ {
		wp.wg.Add(1)
		go wp.work()
	}
}

func (wp *WorkerPool) work() {
	defer wp.wg.Done()
	for task := range wp.jobs {
		start := time.Now()
		output := fmt.Sprintf("processed: %s", task.Payload)
		time.Sleep(10 * time.Millisecond) // simulate work
		wp.results <- Result{
			TaskID:  task.ID,
			Output:  output,
			Elapsed: time.Since(start),
		}
	}
}

func (wp *WorkerPool) Submit(t Task) {
	wp.jobs <- t
}

func (wp *WorkerPool) Close() {
	close(wp.jobs)
	wp.wg.Wait()
	close(wp.results)
}

func (wp *WorkerPool) Results() <-chan Result {
	return wp.results
}

func main() {
	pool := NewWorkerPool(4, 20)
	pool.Start()

	go func() {
		for i := 1; i <= 10; i++ {
			pool.Submit(Task{ID: i, Payload: fmt.Sprintf("task-%d", i)})
		}
		pool.Close()
	}()

	for r := range pool.Results() {
		fmt.Printf("[task %d] %s (took %s)\n", r.TaskID, r.Output, r.Elapsed)
	}
}
