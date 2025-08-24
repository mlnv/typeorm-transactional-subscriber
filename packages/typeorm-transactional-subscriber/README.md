# typeorm-transactional-subscriber

A base class for TypeORM subscribers that ensures afterInsert/afterUpdate/afterRemove hooks are only called after a successful transaction commit.

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
import { TransactionalEntitySubscriberBase } from 'typeorm-transactional-subscriber';
import { EventSubscriber, InsertEvent, TransactionCommitEvent } from 'typeorm';

@EventSubscriber()
export class UserSubscriber extends TransactionalEntitySubscriberBase<User> {
  listenTo() {
    return User;
  }

  async afterInsertCommitted(event: InsertEvent<User>) {
    // This will only be called after transaction commit or right away if not in a transaction
    await sendWelcomeEmail(event.entity.email);
  }
}
```

## How it works
- During a transaction, afterInsert/afterUpdate/afterRemove events are queued per transaction.
- On commit, the queued events are replayed and your hooks are called.
- On rollback, the queue is cleared and your hooks are NOT called.

## License
MIT
  

### Optional Post-Commit Hooks

You may optionally implement any of the following hooks in your subscriber for post-commit logic:

```ts
async afterInsertCommitted(event: InsertEvent<Entity>) { /* ... */ }
async afterUpdateCommitted(event: UpdateEvent<Entity>) { /* ... */ }
async afterRemoveCommitted(event: RemoveEvent<Entity>) { /* ... */ }
```

These hooks will be called after the transaction commits (or immediately if not in a transaction). If not implemented, nothing happens.


### Customizing In-Transaction Event Methods

The `afterInsert`, `afterUpdate`, and `afterRemove` methods are called by TypeORM immediately after the corresponding database operation—**during the transaction**. By default, the base class implementation queues these events for post-commit processing. If you want to add custom logic that runs during the transaction (not after commit), you can override these methods. Be sure to call `super.afterInsert(event)` (or the corresponding method) to preserve the transactional queuing logic. You can place your custom logic before or after the `super` call, depending on when you want it to run:

```ts
async afterInsert(event: InsertEvent<User>) {
  // Custom logic before transactional handling
  await super.afterInsert(event); // Ensures transactional queuing and post-commit logic
  // Custom logic after transactional handling
}
```

> **Note:**
> - If you do not call `super.afterInsert(event)`, the transactional queuing and post-commit logic will be skipped for that event.
> - The same pattern applies to `afterUpdate` and `afterRemove`.
