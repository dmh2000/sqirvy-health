#!/usr/bin/env bash

claude mcp add sqlite -- npx -y mcp-server-sqlite-npx ./db/sqirvy-health.db

claude mcp add context7 -- npx -y @upstash/context7-mcp@latest

claude mcp add playwright npx '@playwright/mcp@latest
