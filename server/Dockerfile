# Use the official Go image as the builder
FROM golang:1.22 AS builder

# Set the working directory inside the container
WORKDIR /build

# Copy go.mod and go.sum to download dependencies first for caching
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the application code
COPY . .

# Build the binary with optimizations and no CGO
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o server ./main.go

# Use a minimal alpine image as the runtime container
FROM alpine:latest

# Install certificates for HTTPS if needed
RUN apk add --no-cache ca-certificates

WORKDIR /root/

# Copy the binary from the builder stage
COPY --from=builder /build/server .

# Expose the port that the server listens on
EXPOSE 42069

# Command to run the binary
CMD ["./server"]