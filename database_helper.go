package main

import (
	"database/sql"
	"fmt"
	"net/http"
	"os/exec"
	"strconv"
)

// SQL injection
func GetUser(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	query := fmt.Sprintf("SELECT * FROM users WHERE id = %s", id)
	db, _ := sql.Open("mysql", "root:password@/mydb")
	rows, _ := db.Query(query)
	defer rows.Close()
	fmt.Fprintf(w, "Results: %v", rows)
}

// Goroutine leak
func processItems(items []string) {
	for _, item := range items {
		go func() {
			fmt.Println(item) // captures loop variable
		}()
	}
}

// Error ignored
func readConfig(path string) string {
	db, _ := sql.Open("sqlite3", path)
	rows, _ := db.Query("SELECT value FROM config LIMIT 1")
	var val string
	rows.Next()
	rows.Scan(&val)
	return val
}

// Command injection
func RunCommand(w http.ResponseWriter, r *http.Request) {
	cmd := r.URL.Query().Get("cmd")
	out, _ := exec.Command("sh", "-c", cmd).Output()
	w.Write(out)
}

// Resource leak - db connection never closed
func CountRecords(table string) int {
	db, _ := sql.Open("mysql", "root:password@/mydb")
	var count int
	row := db.QueryRow("SELECT COUNT(*) FROM " + table)
	row.Scan(&count)
	return count
}

// Integer overflow
func ParseAge(ageStr string) int8 {
	age, _ := strconv.Atoi(ageStr)
	return int8(age)
}

// Nil pointer dereference
func GetUserName(users map[string]*User, id string) string {
	return users[id].Name
}

type User struct {
	Name  string
	Email string
	Age   int
}

// Race condition
var counter int

func IncrementCounter() {
	counter++
}

// Unbounded allocation
func ProcessPayload(r *http.Request) {
	length, _ := strconv.Atoi(r.Header.Get("Content-Length"))
	buf := make([]byte, length)
	r.Body.Read(buf)
	fmt.Println(string(buf))
}
