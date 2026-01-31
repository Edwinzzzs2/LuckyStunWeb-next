#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo "--- Deployment started at $(date) ---"

# 1. 拉取最新代码
echo "Pulling latest changes from GitHub..."
if git pull origin main; then
    echo "Git pull successful."
else
    echo "Error: Git pull failed. Stopping deployment."
    exit 1
fi

# 2. 触发 1Panel API 完成后续工作 (安装依赖、构建、重启)
echo "Triggering 1Panel API to handle dependencies, build and restart..."

# 4. 重启应用 (通过 1Panel API)
echo "Restarting application via 1Panel API..."

# 加载 .env.local 环境变量 (如果存在)
ENV_FILE="$PROJECT_ROOT/.env.local"
if [ -f "$ENV_FILE" ]; then
    echo "Loading environment variables from $ENV_FILE..."
    set -a
    source <(tr -d '\r' < "$ENV_FILE")
    set +a
else
    echo "Warning: .env.local not found at $ENV_FILE"
fi

# 优先从环境变量获取
API_KEY="${PANEL_API_KEY}"
RUNTIME_ID="${PANEL_RUNTIME_ID}"
API_URL="${PANEL_API_URL}"

if [ -z "$API_KEY" ] || [ -z "$RUNTIME_ID" ]; then
    echo "Error: PANEL_API_KEY or PANEL_RUNTIME_ID is not set (from .env.local or process env)."
    exit 1
fi

# 1. 获取当前时间戳
TIMESTAMP=$(date +%s)

# 2. 拼接字符串: 1panel + Key + 时间戳
RAW_STRING="1panel${API_KEY}${TIMESTAMP}"

# 3. 计算 MD5 Token (使用 md5sum)
# 注意: 如果你的环境没有 md5sum，可以尝试用 openssl md5
if command -v md5sum &> /dev/null
then
    TOKEN=$(echo -n "$RAW_STRING" | md5sum | cut -d ' ' -f 1)
else
    TOKEN=$(echo -n "$RAW_STRING" | openssl md5 | awk '{print $NF}')
fi

# 4. 发送请求
RESPONSE=$(curl --location --silent --show-error --request POST "$API_URL" \
 --header "1Panel-Token: $TOKEN" \
 --header "1Panel-Timestamp: $TIMESTAMP" \
 --header "Content-Type: application/json" \
 --data "{\"operate\":\"restart\",\"ID\":$RUNTIME_ID}")

echo "1Panel API Response: $RESPONSE"

if [[ $RESPONSE == *"\"code\": 200"* ]] || [[ $RESPONSE == *"\"code\":200"* ]]; then
    echo "Application restart triggered successfully."
else
    echo "Failed to trigger restart. Response: $RESPONSE"
fi

echo "--- Deployment finished at $(date) ---"
