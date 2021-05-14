#!/usr/bin/env bash

echo "Provisioning License"

cd /home/centos/appdynamics/EUM/eum-processor && ./bin/provision-license /home/centos/appdynamics/platform/controller/license.lic

echo "Provisioning complete"