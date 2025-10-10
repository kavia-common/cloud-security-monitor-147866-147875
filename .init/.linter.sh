#!/bin/bash
cd /home/kavia/workspace/code-generation/cloud-security-monitor-147866-147875/cloud_security_dashboard_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

