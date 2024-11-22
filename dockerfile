# FROM node:latest 
# RUN apt-get update && apt-get install -y \
#     curl \
#     postgresql-client \
#     && rm -rf /var/lib/apt/lists/*

# WORKDIR /chien/src/app 

# COPY package*.json ./ 

# RUN npm install 

# COPY docker-entrypoint.sh /usr/local/bin/
# RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# COPY . .

# ENV NODE_ENV production
# ENV PORT=3002

# RUN rm -rf node_modules && npm install
# EXPOSE 3002
# # 使用啟動腳本
# ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
FROM node:18

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
ENV LD_LIBRARY_PATH=/usr/local/lib:$LD_LIBRARY_PATH

EXPOSE 3002

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]