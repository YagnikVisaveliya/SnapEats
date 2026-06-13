# 🍔 SnapEats

A full-stack, microservices-based food delivery platform built with TypeScript. SnapEats connects customers, restaurants, and riders through a real-time ordering and delivery experience.

🌐 **Live Demo:** [snapeats-food.vercel.app](https://snapeats-food.vercel.app)

---

## Screenshots
 
### Login / Welcome Screen
 
![SnapEats Login Screen](././client/src/assets/login-screen.png)
 
---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Services](#services)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Docker Deployment](#docker-deployment)
- [Project Structure](#project-structure)
- [Contributing](#contributing)

---

## Overview

SnapEats is a production-ready food delivery application that allows users to browse restaurants, place orders, and track deliveries in real time. The backend is structured as independent microservices communicating via RabbitMQ, making it scalable and easy to extend.

---

## Architecture

SnapEats uses a **microservices architecture** with asynchronous messaging:

```
Client (React/Vite)
       │
       ▼
  ┌─────────────────────────────────────────────┐
  │                 Backend Services            │
  │                                             │
  │  Auth  │  Restaurant  │  Utils    │  Admin  │ 
  │  Rider │  Wallet      │  Realtime           │
  │                                             │
  └──────────────────┬──────────────────────────┘
                     │
              RabbitMQ (Message Broker)
```

Services communicate asynchronously via **RabbitMQ**, ensuring loose coupling and fault tolerance.

---

## Tech Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Frontend    | React, TypeScript, Vite           |
| Backend     | Node.js, TypeScript, Express      |
| Messaging   | RabbitMQ                          |
| Realtime    | WebSockets (Realtime service)     |
| Containerization | Docker, Docker Compose       |
| Deployment  | Vercel (client), Render, AWS, Docker Hub (services) |

---

## Services

| Service      | Port | Description                                           |
|--------------|------|-------------------------------------------------------|
| `auth`       | 3000 | User authentication & authorization (JWT)             |
| `restaurant` | 3001 | Restaurant and menu management                        |
| `utils`      | 3002 | Shared utilities (email, notifications, etc.)         |
| `realtime`   | 3004 | Real-time updates via WebSocket for order tracking    |
| `rider`      | 3005 | Rider management and delivery assignment              |
| `admin`      | 3006 | Admin panel backend for platform management           |
| `wallet`     | 3007 | Wallet and payment management                         |
| `client`     | 80   | React frontend served via Nginx                       |
| `rabbitmq`   | 5672 / 15672 | Message broker + management UI              |

---

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)
- [Node.js](https://nodejs.org/) v18+ (for local development)
- [Git](https://git-scm.com/)

### Clone the Repository

```bash
git clone https://github.com/YagnikVisaveliya/SnapEats.git
cd SnapEats
```

### Run with Docker Compose

```bash
# Build and start all services
docker-compose up -d --build
```

The client will be available at `http://localhost` and the RabbitMQ management UI at `http://localhost:15672` (credentials: `admin` / `admin123`).

### Local Development

Each service can be run independently. Navigate to the service folder and install dependencies:

```bash
cd server/auth
npm install
npm run dev
```

Repeat for any other service you want to run locally.

---

## Environment Variables

Each service has its own `.env` file located at `server/<service-name>/.env`. Create these files before running the services locally.

Example for the `auth` service (`server/auth/.env`):

```env
PORT=3000
JWT_SECRET=your_jwt_secret
MONGO_URI=your_mongodb_connection_string
RABBITMQ_URL=amqp://admin:admin123@localhost:5672
```

> Refer to each service's source code for the full list of required environment variables.

---

## Docker Deployment

### Build and Push a Single Service

```bash
docker-compose build client
docker-compose push client
```

### Build and Push Multiple Services

```bash
docker-compose build wallet utils client
docker-compose push wallet utils client
```

### Rebuild and Restart All Services

```bash
docker-compose down
docker-compose up -d --build
```

---

## Project Structure

```
SnapEats/
├── client/                  # React frontend (TypeScript + Vite)
├── server/
│   ├── auth/                # Authentication service
│   ├── restaurant/          # Restaurant & menu service
│   ├── utils/               # Utility service (email, etc.)
│   ├── realtime/            # WebSocket / realtime service
│   ├── rider/               # Rider management service
│   ├── admin/               # Admin service
│   └── wallet/              # Wallet & payments service
├── docker-compose.yml       # Multi-service Docker Compose config
└── README.md
```

---

## Contributing

Contributions are welcome! To get started:

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## Author

**Yagnik Visaveliya**
GitHub: [@YagnikVisaveliya](https://github.com/YagnikVisaveliya)

---

> Built with ❤️ using TypeScript and microservices.
