import {
  InsertEvent,
  TransactionCommitEvent,
  TransactionRollbackEvent,
  EntitySubscriberInterface,
} from "typeorm";

/**
 * Base class for transactional entity subscribers.
 *
 * This class provides a pattern for handling TypeORM entity events (insert, update, remove)
 * in a transactional-safe way. Events that occur within a transaction are queued and only
 * processed after the transaction commits, ensuring post-commit logic is not executed if the transaction rolls back.
 *
 * Subclasses may optionally implement any of the following hooks for post-commit logic:
 *   - afterInsertCommitted(event)
 *   - afterUpdateCommitted(event)
 *   - afterRemoveCommitted(event)
 *
 * If a hook is implemented, it will be called after the transaction commits (or immediately if not in a transaction).
 * If not implemented, nothing happens.
 */
export abstract class TransactionalEntitySubscriberBase<T = any>
implements EntitySubscriberInterface<T>
{
  /**
   * TypeORM: Called after a transaction is started.
   * Increments transaction depth for nested transaction support.
   */
  public afterTransactionStart?(event: { queryRunner: any }): void {
    this.incrementTxDepth(event.queryRunner);
  }

  /**
   * Handles the TypeORM afterInsert event.
   *
   * If inside a transaction, queues the event for post-commit processing.
   * If not in a transaction, immediately calls afterInsertCommitted if implemented by the subclass.
   *
   * @param event The TypeORM InsertEvent.
   */
  public async afterInsert(event: InsertEvent<T>) {
    if (event.queryRunner && event.queryRunner.isTransactionActive) {
      const store = this.getOrCreateTxStore(event.queryRunner);
      store.inserted.push(event);
    } else if (typeof (this as any).afterInsertCommitted === "function") {
      await (this as any).afterInsertCommitted(event);
    }
  }

  /**
   * Handles the TypeORM afterUpdate event.
   *
   * If inside a transaction, queues the event for post-commit processing.
   * If not in a transaction, immediately calls afterUpdateCommitted if implemented by the subclass.
   *
   * @param event The TypeORM UpdateEvent.
   */
  public async afterUpdate(event: any) {
    if (event.queryRunner && event.queryRunner.isTransactionActive) {
      const store = this.getOrCreateTxStore(event.queryRunner);
      store.updated.push(event);
    } else if (typeof (this as any).afterUpdateCommitted === "function") {
      await (this as any).afterUpdateCommitted(event);
    }
  }

  /**
   * Handles the TypeORM afterRemove event.
   *
   * If inside a transaction, queues the event for post-commit processing.
   * If not in a transaction, immediately calls afterRemoveCommitted if implemented by the subclass.
   *
   * @param event The TypeORM RemoveEvent.
   */
  public async afterRemove(event: any) {
    if (event.queryRunner && event.queryRunner.isTransactionActive) {
      const store = this.getOrCreateTxStore(event.queryRunner);
      store.removed.push(event);
    } else if (typeof (this as any).afterRemoveCommitted === "function") {
      await (this as any).afterRemoveCommitted(event);
    }
  }

  /**
   * Called after a transaction successfully commits.
   *
   * Calls any implemented after*Committed hooks for all queued events in the transaction.
   *
   * @param event The TypeORM TransactionCommitEvent.
   */
  public async afterTransactionCommit(event: TransactionCommitEvent) {
    this.decrementTxDepth(event.queryRunner);
    // Only run post-commit logic at the outermost transaction (depth 0)
    if (this.getOrCreateTxDepth(event.queryRunner) === 0) {
      const store = this.getOrCreateTxStore(event.queryRunner);
      if (store) {
        if (typeof (this as any).afterInsertCommitted === "function") {
          for (const insertEvent of store.inserted) {
            await (this as any).afterInsertCommitted(insertEvent);
          }
        }
        if (typeof (this as any).afterUpdateCommitted === "function") {
          for (const updateEvent of store.updated) {
            await (this as any).afterUpdateCommitted(updateEvent);
          }
        }
        if (typeof (this as any).afterRemoveCommitted === "function") {
          for (const removeEvent of store.removed) {
            await (this as any).afterRemoveCommitted(removeEvent);
          }
        }
        store.inserted = [];
        store.updated = [];
        store.removed = [];
      }
    }
  }

  /**
   * Called after a transaction rolls back.
   *
   * Clears all queued events for the transaction to avoid processing them after a failed transaction.
   *
   * @param event The TypeORM TransactionRollbackEvent.
   */
  public async afterTransactionRollback(event: TransactionRollbackEvent) {
    this.decrementTxDepth(event.queryRunner);
    // Only clear events at the outermost transaction (depth 0)
    if (this.getOrCreateTxDepth(event.queryRunner) === 0) {
      const store = this.getOrCreateTxStore(event.queryRunner);
      if (store) {
        store.inserted = [];
        store.updated = [];
        store.removed = [];
      }
    }
  }

  /**
   * Internal: Store events per transaction (per QueryRunner).
   *
   * @param queryRunner The TypeORM QueryRunner for the current transaction context.
   * @returns The per-transaction event store object.
   */
  protected getOrCreateTxStore(queryRunner: any) {
    if (!queryRunner) {
      return null;
    }
    if (!queryRunner._transactionalSubscriberStore) {
      queryRunner._transactionalSubscriberStore = {
        inserted: [],
        updated: [],
        removed: [],
      };
    }
    return queryRunner._transactionalSubscriberStore;
  }

  /**
   * Internal: Maintain transaction depth per QueryRunner for nested transaction support.
   * Increments on transaction start, decrements on commit/rollback.
   * Only triggers post-commit/rollback logic at depth 0 (outermost transaction).
   */
  protected getOrCreateTxDepth(queryRunner: any): number {
    if (!queryRunner) return 0;
    if (typeof queryRunner._transactionalSubscriberDepth !== "number") {
      queryRunner._transactionalSubscriberDepth = 0;
    }
    return queryRunner._transactionalSubscriberDepth;
  }

  protected incrementTxDepth(queryRunner: any) {
    if (!queryRunner) return;
    if (typeof queryRunner._transactionalSubscriberDepth !== "number") {
      queryRunner._transactionalSubscriberDepth = 0;
    }
    queryRunner._transactionalSubscriberDepth++;
  }

  protected decrementTxDepth(queryRunner: any) {
    if (!queryRunner) return;
    if (typeof queryRunner._transactionalSubscriberDepth !== "number") {
      queryRunner._transactionalSubscriberDepth = 0;
    }
    queryRunner._transactionalSubscriberDepth--;
    if (queryRunner._transactionalSubscriberDepth < 0) {
      queryRunner._transactionalSubscriberDepth = 0;
    }
  }
}
