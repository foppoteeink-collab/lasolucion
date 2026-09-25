# Security Spec for Firebase Integration

## 1. Data Invariants
- All data is scoped strictly to a `userId`.
- No user can access or modify another user's `users/{userId}` document or its subcollections.
- User profile (PlayerStats) must only contain valid gameplay stats (numbers).
- Tasks, pomodoros, and habits must belong strictly to the authenticated user's subcollections.
- ID poisoning must be blocked (`userId`, `taskId`, etc. must be valid format).

## 2. Dirty Dozen Payloads
1. Create `users/{userId}` where `userId` != `request.auth.uid`. (Identity Spoofing)
2. Update `users/{userId}` changing `xp` to a string instead of number. (Type Poisoning)
3. Create `users/{userId}/tasks/{taskId}` with missing required fields. (Schema bypass)
4. Read `users/{otherUserId}`. (Data Leak)
5. Create `users/{userId}` without being authenticated. (Unauth write)
6. Inject 2MB string into `TaskItem.title`. (Denial of Wallet)
7. Array size explosion in `tags` > 50.
8. Updating terminal status from `completed` to `todo` without admin/app logic bypasses.
9. Injecting invalid `status` enum string into `TaskItem`.
10. Reading list of tasks across multiple users via CollectionGroup query.
11. Providing string with special characters for `{userId}` to path poisoning.
12. Creating a user doc containing PII not defined in blueprint.
