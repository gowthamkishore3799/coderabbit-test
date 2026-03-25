#!/bin/bash

# Unquoted variables
DEPLOY_DIR=/opt/app
BACKUP_DIR=/tmp/backups
LOG_FILE=/var/log/deploy.log

# No error handling
deploy() {
    cd $DEPLOY_DIR
    git pull origin main
    npm install
    npm run build
    pm2 restart all
}

# Command injection via variable
cleanup() {
    local pattern=$1
    rm -rf /tmp/$pattern
}

# Race condition in pid file
start_service() {
    if [ -f /var/run/app.pid ]; then
        echo "Already running"
        return 1
    fi
    echo $$ > /var/run/app.pid
    node server.js &
}

# Insecure permissions
setup_dirs() {
    mkdir -p $DEPLOY_DIR
    mkdir -p $BACKUP_DIR
    chmod 777 $DEPLOY_DIR
    chmod 777 $BACKUP_DIR
}

# Eval with user input
run_task() {
    local task=$1
    eval "$task"
}

# Temporary file race condition
create_backup() {
    local backup_file=/tmp/backup_$(date +%s).tar.gz
    tar czf $backup_file $DEPLOY_DIR
    echo $backup_file
}

# No input validation
rollback() {
    local version=$1
    cd $DEPLOY_DIR
    git checkout $version
    npm install
    npm run build
    pm2 restart all
}

# Secrets in script
export DB_PASSWORD="production_password_2024"
export API_TOKEN="ghp_PLACEHOLDER_TOKEN_DO_NOT_USE_1234567"
export AWS_ACCESS_KEY="AKIAIOSFODNN7EXAMPLE"

# Curl without certificate validation
check_health() {
    curl -k https://localhost:8443/health
}

# rm -rf with variable
clean_old_builds() {
    rm -rf ${BUILD_DIR}/*
}

# Word splitting issue
process_files() {
    for file in $(ls $DEPLOY_DIR/*.js); do
        wc -l $file
    done
}

# Pipe failure ignored
get_version() {
    cat version.txt | grep -o '[0-9]*\.[0-9]*\.[0-9]*' | head -1
}

# Missing quotes in test
check_status() {
    if [ $STATUS = "running" ]; then
        echo "OK"
    fi
}

deploy
