Test session data logic:
1. Create new session -> default archived: false (undefined/falsy)
2. Delete session -> archived: true, active session changes if needed.
3. Try deleting last session -> should fail.
