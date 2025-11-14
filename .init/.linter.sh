#!/bin/bash
cd /home/kavia/workspace/code-generation/employee-attendance-management-system-225195/employee_attendence_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

