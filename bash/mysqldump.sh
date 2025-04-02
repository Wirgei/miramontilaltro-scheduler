#!/bin/bash

# export $(grep -v '^#' .env.dev.mariadb | xargs)
source /var/services/homes/alberto/node/miramontilaltro-scheduler/.env

APP_NAME="databases"
BACKUP_PATH="/volume1/backup/${APP_NAME}"

# Making backup directory if not exists
if [ ! -d ${BACKUP_PATH} ]; then
  mkdir -p ${BACKUP_PATH}
fi

# CONSTANT
TIME_NOW=`date +'%F_%H.%M'`

# Functions
# backup_files() {
#     FILE_NAME_PATH="${BACKUP_PATH}/${TIME_NOW}__${APP_NAME}_files.tar.gz"
#     docker exec -ti ${APP_NAME}-web sh -c 'tar -czvf /backup.tar.gz /var/www/html'
#     docker cp ${APP_NAME}-web:/backup.tar.gz ${FILE_NAME_PATH}
#     docker exec -ti ${APP_NAME}-web sh -c 'rm /backup.tar.gz'
# }

backup_db() {
    FILE_NAME_PATH="${BACKUP_PATH}/${TIME_NOW}_${APP_NAME}_fulldump.sql.tar.gz"
    mysqldump -u ${MARIADB_BACKUP_USER} -p${MARIADB_BACKUP_PASSWORD} --all-databases | gzip > ${FILE_NAME_PATH}
}
 
# Argument parsing
case "$1" in
    # files)
    #     backup_files
    #     ;;
    db)
        backup_db
        ;;
    # both)
    #     backup_files
    #     backup_db
    #     ;;
    *)
        # echo "Usage: $0 {files|db|both}"
        echo "Usage: $0 {db}"
        exit 1
        ;;
esac
