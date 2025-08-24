# typeorm-transactional-subscriber

A base class for TypeORM subscribers that adds afterInsertCommitted, afterUpdateCommitted, and afterRemoveCommitted hooks, ensuring side effects only run after a successful transaction commit (never on rollback or savepoint release).

## Why?

TypeORM's entity subscribers fire hooks (like afterInsert) even if the transaction is later rolled back. This package allows you to safely perform side effects (like sending emails or publishing to a message queue) only after a transaction is committed.

## Installation

```sh
npm install typeorm-transactional-subscriber
# or
pnpm add typeorm-transactional-subscriber
```

## Usage

```ts
import { TransactionalEntitySubscriberBase } from "typeorm-transactional-subscriber";
import {
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
} from "typeorm";

@EventSubscriber()
export class UserSubscriber extends TransactionalEntitySubscriberBase<User> {
  listenTo() {
    return User;
  }

  async afterInsertCommitted(event: InsertEvent<User>) {
    // Called after transaction commit or immediately if not in a transaction
    await sendWelcomeEmail(event.entity.email);
  }

  async afterUpdateCommitted(event: UpdateEvent<User>) {
    // Called after transaction commit or immediately if not in a transaction
    await logUserUpdate(event.entity.id);
  }

  async afterRemoveCommitted(event: RemoveEvent<User>) {
    // Called after transaction commit or immediately if not in a transaction
    await cleanupUserData(event.entity.id);
  }
}
```

## How it works

- During a transaction, afterInsert/afterUpdate/afterRemove events are queued per transaction.
- On commit, the queued events are replayed and your hooks are called.
- On rollback, the queue is cleared and "*Committed" hooks are NOT called.


### Customizing In-Transaction Event Methods

The `afterInsert`, `afterUpdate`, and `afterRemove` methods are called by TypeORM immediately after the corresponding database operation—**during the transaction**. By default, the base class implementation queues these events for post-commit processing. If you want to add custom logic that runs during the transaction (not after commit), you can override these methods. Be sure to call `super.afterInsert(event)` (or the corresponding method) to preserve the transactional queuing logic. You can place your custom logic before or after the `super` call, depending on when you want it to run:

```ts
async afterInsert(event: InsertEvent<User>) {
  await super.afterInsert(event); // Ensures transactional queuing and post-commit logic
  // Custom logic after transactional handling
}
```

> **Note:**
>
> - If you do not call `super.afterInsert(event)`, the transactional queuing and post-commit logic will be skipped for that event.
> - The same pattern applies to `afterUpdate` and `afterRemove`.

## ⚠️ Overriding afterTransactionStart

If you override the `afterTransactionStart` method in a subclass of `TransactionalEntitySubscriberBase`, **you must call** `super.afterTransactionStart(event)` inside your override. Failing to do so will break the transaction depth tracking, and nested transaction (savepoint) support will not work correctly. This may cause post-commit hooks to be triggered after inner/nested commits instead of only after the outermost commit.

**Example:**

```ts
public afterTransactionStart(event: { queryRunner: any }) {
  // custom logic here
  super.afterTransactionStart(event); // ensure depth tracking
}
```

Always call the base implementation to preserve correct transactional behavior.

### Nested Transactions (Savepoints) Support

This package supports nested transactions (savepoints) out of the box. If you use TypeORM's nested transactions (e.g., by calling `manager.transaction()` inside another transaction), the subscriber will maintain a transaction depth counter per QueryRunner. Post-commit hooks (such as `afterInsertCommitted`, `afterUpdateCommitted`, `afterRemoveCommitted`) are only called after the **outermost** transaction is committed. Inner (nested) commits or rollbacks do not trigger post-commit hooks; only the final, outer commit does.

**Example:**

```ts
await dataSource.manager.transaction(async (outerManager) => {
  // ...
  await outerManager.transaction(async (innerManager) => {
    // ...
  });
  // ...
});
// Only after the outermost commit will post-commit hooks run.
```

This ensures that side effects (like event publishing, logging, etc.) only occur if the entire transaction scope (including all nested savepoints) is successfully committed.

## License

MIT
