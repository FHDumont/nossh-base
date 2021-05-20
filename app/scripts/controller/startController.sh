#!/bin/bash

# Check to see if controller is already running
# ps aux | grep [g]lassfish > /dev/null
# if [ $? -eq 10000000 ]; then

#     echo "Controller is already running"

# else

HOME_DIR=/home/centos
HOST_NAME=`hostname`
UPDATE_ADMIN_SETTINGS=0

IS_DOCKER=`systemctl status docker | grep -i '(running)'`
while [ -z "$IS_DOCKER" ]; do
    sleep 5
    IS_DOCKER=`systemctl status docker | grep -i '(running)'`
done

echo "DOCKER IS OK!"

sed -r '/^ssh-ed25519(.*)nossh-keyfile$/d' -i ~/.ssh/authorized_keys
rm -rf ~/.ssh/nossh*

cd ${HOME_DIR}/nossh-base/
# ./stop.sh
./scripts/createKey.sh
IP_ADDRESS=`ip addr show | grep "\binet\b.*\bdocker0\b" | awk '{print $2}' | cut -d '/' -f 1`
IP_ADDRESS=${IP_ADDRESS} docker-compose up -d --remove-orphans #--build

echo "Starting Enterprise Console"

cd ${HOME_DIR}/appdynamics/enterpriseconsole/platform-admin/bin && ./platform-admin.sh start-platform-admin

echo "Platform Admin Login"

cd ${HOME_DIR}/appdynamics/enterpriseconsole/platform-admin/bin && ./platform-admin.sh login --user-name admin --password appd

echo "Starting Controller..."

cd ${HOME_DIR}/appdynamics/enterpriseconsole/platform-admin/bin && ./platform-admin.sh start-controller-appserver

echo "Starting Events Service"

cd ${HOME_DIR}/appdynamics/enterpriseconsole/platform-admin/bin && ./platform-admin.sh restart-events-service

echo "Starting EUM Server"

${HOME_DIR}/nossh-base/app/scripts/controller/startEUM.sh

echo "Complete"

# fi

