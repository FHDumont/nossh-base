#!/usr/bin/env bash

# Check to see if controller is already running
ps aux | grep [g]lassfish > /dev/null
if [ $? -eq 0 ]; then

    echo "Controller is already running"

else

    HOME_DIR=/home/centos
    HOST_NAME=`hostname`
    UPDATE_ADMIN_SETTINGS=0

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

fi

