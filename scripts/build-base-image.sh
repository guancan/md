#!/bin/bash

RELEASE_DIR='./docker';
REPO_NAME=${1:-travor223/md} 

for app_ver in $RELEASE_DIR/*; do

    if [ -f "$app_ver/Dockerfile.base" ]; then

        tag=$(echo $app_ver | cut -b 10-);
        echo "Build: $tag";
        set -a
            . "$app_ver/.env"
        set +a

        echo $app_ver
        echo "VER_APP: $VER_APP"
        echo "VER_NGX: $VER_NGX"
        echo "VER_GOLANG: $VER_GOLANG"
        echo "VER_ALPINE: $VER_ALPINE"

        docker build --build-arg VER_APP=$VER_APP -f "$app_ver/Dockerfile.base" -t "$REPO_NAME:${VER_APP}-assets" "$app_ver"
    fi

done