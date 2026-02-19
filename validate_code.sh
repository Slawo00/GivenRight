#!/bin/bash
# Code validieren mit GitHub Models Opus 4.6

FILES=$(find src -name "*.js" | head -10)

curl -s -X POST https://models.inference.ai.azure.com/chat/completions \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"model\": \"anthropic/Claude-3.5-sonnet\",
    \"messages\": [
      {
        \"role\": \"system\",
        \"content\": \"You are a React Native expert. Find all syntax errors, missing imports, and logic bugs in the code. List every issue with line numbers.\"
      },
      {
        \"role\": \"user\",
        \"content\": \"Review these React Native files for errors:\

$(for f in $FILES; do echo "=== $f ==="; head -100 "$f"; done)\
\"
      }
    ],
    \"max_tokens\": 4000
  }" 2>&1 | tee validation_result.json
