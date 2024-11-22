
docker buildx build --platform linux/amd64 -t chiennn/chatbotapi-api:latest --load .
docker tag chatbotapi-api chiennn/chatbotapi-api:latest
docker push chiennn/chatbotapi-api:latest