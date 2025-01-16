FROM node:18

ARG PORT
ARG DB_USER
ARG DB_HOST
ARG DB_DATABASE
ARG DB_PASSWORD
ARG DB_PORT
ARG OPENAI_API_KEY

# 安裝所有必要的系統依賴
RUN apt-get update && apt-get install -y \
    curl \
    postgresql-client \
    python3 \
    python3-pip \
    build-essential \
    libc6-dev \
    cmake \
    libblas-dev \
    liblapack-dev \
    libatlas-base-dev \
    libhdf5-dev \
    gfortran \
    wget \
    git \
    pkg-config \
    libcairo2-dev \
    libjpeg-dev \
    libgif-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /chien/src/app 

# 複製 package.json
COPY package*.json ./ 

# 移除現有的 node_modules 和 package-lock.json
RUN rm -rf node_modules package-lock.json

# 重新安裝依賴
RUN npm cache clean --force && \
    npm install -g node-gyp && \
    npm install --build-from-source @tensorflow/tfjs-node && \
    npm install

# 複製啟動腳本
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# 複製其餘檔案
COPY . .

# 環境變數設定
ENV NODE_ENV=production
ENV PORT=3002
ENV DB_USER=${DB_USER}
ENV DB_HOST=${DB_HOST}
ENV DB_DATABASE=${DB_DATABASE}
ENV DB_PASSWORD=${DB_PASSWORD}
ENV DB_PORT=${DB_PORT}
ENV OPENAI_API_KEY=${OPENAI_API_KEY}
ENV LD_LIBRARY_PATH=/usr/local/lib:$LD_LIBRARY_PATH

EXPOSE 3002

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]