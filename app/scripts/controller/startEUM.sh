#!/usr/bin/env bash

echo "Starting EUM Server"

cd /home/centos/appdynamics/EUM/eum-processor && ./bin/eum.sh stop

cd /home/centos/appdynamics/EUM/eum-processor && ./bin/eum.sh start

echo "EUM restart complete"
