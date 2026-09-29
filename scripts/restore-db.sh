#!/usr/bin/env bash
# Database Restore Script
set -e

if [ -z "$1" ]; then
  echo "Usage: ./scripts/restore-db.sh <path-to-backup.sql.gz>"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Error: Backup file '$BACKUP_FILE' does not exist."
  exit 1
fi

echo "⚠️ WARNING: This will overwrite the current database with '$BACKUP_FILE'."
read -p "Are you sure you want to proceed? (y/N): " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
  echo "Operation cancelled."
  exit 0
fi

echo "🔄 Restoring database..."
gunzip -c "$BACKUP_FILE" | docker exec -i sovereign_postgres psql -U sovereign -d sovereign_dating

echo "✅ Database restored successfully from '$BACKUP_FILE'."
