#!/usr/bin/env bash
# Automated PostgreSQL Backup Script
set -e

BACKUP_DIR="${BACKUP_DIR:-./backups}"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/sovereign_dating_backup_$TIMESTAMP.sql.gz"

echo "📦 Starting automated database backup at $(date)..."

docker exec -t sovereign_postgres pg_dump -U sovereign sovereign_dating | gzip > "$BACKUP_FILE"

echo "✅ Database backup created successfully: $BACKUP_FILE"
echo "📊 Backup file size: $(du -h "$BACKUP_FILE" | cut -f1)"

# Keep last 7 days of backups
find "$BACKUP_DIR" -name "sovereign_dating_backup_*.sql.gz" -mtime +7 -delete
echo "🧹 Old backups pruned (retention: 7 days)."
