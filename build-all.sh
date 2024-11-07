#!/bin/bash

pnpm i --recursive

cd packages

for folder in */; do 
    cd "$folder"

    if [ -f "package.json" ] && [ "$folder" != "testing/" ]; then 
        echo "Building package in $folder"
        pnpm build
    else 
        echo "Skipping $folder"
    fi

    cd ..
done