#!/bin/bash
cd /home/kavia/workspace/code-generation/webhangman-72999-1c1b806b/hangman_frontend_workspace/hangman_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

