# HEARTBEAT - Regelmäßige Checks

## Tasks
- Check `TASKS.md` auf offene/doing Tasks
- Falls aktive Tasks da sind: Fortschritt prüfen, Status updaten
- Falls neue Tasks offen sind: User benachrichtigen

## Timing
- Alle 30 Minuten (wenn Tasks existieren)
- Silent wenn keine offenen Tasks (HEARTBEAT_OK)
- Update user nur bei Statusänderungen oder bei Anfrage

## What to Check
1. Neue Tasks in TASKS.md?
2. Irgendwelche Tasks im "doing" Status → kann ich weitermachen?
3. Gibt es Blocker oder Rückfragen?
