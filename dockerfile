# FROM node:latest 
# WORKDIR /chien/src/app 
# COPY package*.json ./ 

# RUN npm install 

# ADD https://github.com/vishnubob/wait-for-it/raw/master/wait-for-it.sh /usr/local/bin/wait-for-it
# RUN chmod +x /usr/local/bin/wait-for-it

# ENV NODE_ENV production
# COPY . . 
# RUN rm -rf node_modules && npm install
# EXPOSE 3002
# CMD npm start 

FROM node:latest 
RUN apt-get update && apt-get install -y \
    curl \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /chien/src/app 

COPY package*.json ./ 

RUN npm install 

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

COPY . .

ENV NODE_ENV production
ENV PORT=3002

RUN rm -rf node_modules && npm install
EXPOSE 3002
# 使用啟動腳本
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]