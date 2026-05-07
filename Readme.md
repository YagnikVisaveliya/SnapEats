docker-compose build client
docker-compose push client


docker-compose build
docker-compose up -d

# Only builds and pushes what you name
docker-compose build wallet utils client
docker-compose push wallet utils client

docker-compose down
docker-compose up -d --build
