# FROM postgres:13.2-alpine

# RUN apk add --no-cache make gcc g++ clang llvm10 wget

# RUN wget https://github.com/pgvector/pgvector/archive/refs/tags/v0.1.4.tar.gz \
#     && tar -xzvf v0.1.4.tar.gz \
#     && cd pgvector-0.1.4 \
#     && make && make install

# RUN apk del make gcc g++ clang llvm10

FROM node:latest 
WORKDIR /chien/src/app 
COPY package*.json ./ 

RUN npm install 

ADD https://github.com/vishnubob/wait-for-it/raw/master/wait-for-it.sh /usr/local/bin/wait-for-it
RUN chmod +x /usr/local/bin/wait-for-it

ENV NODE_ENV production
COPY . . 
RUN rm -rf node_modules && npm install
EXPOSE 3002
CMD npm start 