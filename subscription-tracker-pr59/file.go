package main

import (
	"bytes"
	"errors"
	"fmt"
)

type Point struct {
	X, Y int
}

func ptrToComputedInt() *int {
	return new(40 + 2)
}

func ptrToPoint() *Point {
	return new(Point{X: 10, Y: 20})
}

func firstN(buf *bytes.Buffer, n int) string {
	b, _ := buf.Peek(n)
	return string(b)
}

func asAny[T any](err error) (T, bool) {
	return errors.AsType[T](err)
}

type Adder[A Adder[A]] interface {
	Add(A) A
}

type MyInt int

func (x MyInt) Add(y MyInt) MyInt { return x + y }

func sum[A Adder[A]](a, b A) A { return a.Add(b) }

func main() {
	fmt.Println(*ptrToComputedInt())

	p := ptrToPoint()
	fmt.Println(p.X, p.Y)

	var buf bytes.Buffer
	buf.WriteString("coderabbit")
	fmt.Println(firstN(&buf, 4))

	if v, ok := asAny[error](fmt.Errorf("wrapped: %w", errors.New("boom"))); ok {
		fmt.Println("AsType matched:", v.Error())
	}

	fmt.Println(sum(MyInt(10), MyInt(32)))
}
