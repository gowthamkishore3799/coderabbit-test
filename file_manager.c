#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Buffer overflow
void copy_name(char *dest, const char *src) {
    strcpy(dest, src);
}

// Format string vulnerability
void log_message(const char *user_input) {
    printf(user_input);
}

// Use after free
char* get_temp_buffer() {
    char *buf = malloc(256);
    strcpy(buf, "temporary data");
    free(buf);
    return buf;
}

// Double free
void process_data(char *data) {
    char *copy = malloc(strlen(data) + 1);
    strcpy(copy, data);
    free(copy);
    // ... more processing ...
    free(copy);
}

// Memory leak
void read_file(const char *filename) {
    FILE *f = fopen(filename, "r");
    char *buffer = malloc(1024);
    if (f == NULL) {
        return; // buffer leaked
    }
    fread(buffer, 1, 1024, f);
    fclose(f);
    // buffer never freed
}

// Integer overflow
int calculate_size(int width, int height) {
    return width * height * sizeof(int);
}

// Null pointer dereference
void print_config(struct Config *config) {
    printf("Name: %s\n", config->name);
}

struct Config {
    char name[64];
    int value;
};

// Stack buffer overflow
void get_input() {
    char buffer[16];
    gets(buffer);
    printf("Got: %s\n", buffer);
}

// Uninitialized variable
int compute_result(int flag) {
    int result;
    if (flag > 0) {
        result = 42;
    }
    return result;
}

// Race condition with signal handler
int global_flag = 0;

void handler(int sig) {
    global_flag = 1;
}

void wait_for_signal() {
    while (!global_flag) {
        // busy wait - not signal safe
    }
}

// Off by one
void fill_array(int *arr, int size) {
    for (int i = 0; i <= size; i++) {
        arr[i] = i;
    }
}

// Unsafe string concatenation
void build_path(char *dest, const char *dir, const char *file) {
    sprintf(dest, "%s/%s", dir, file);
}
