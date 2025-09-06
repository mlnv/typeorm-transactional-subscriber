import {
  EventSubscriber,
  InsertEvent,
  RemoveEvent,
  SoftRemoveEvent,
  UpdateEvent,
} from "typeorm";
import { Person } from "./entities/Person";
import { Company } from "./entities/Company";
import { eventLog } from "./EventLog";
import { TransactionalEntitySubscriberBase } from "typeorm-transactional-subscriber";

@EventSubscriber()
export class EntityEventSubscriber extends TransactionalEntitySubscriberBase<any> {
  listenTo() {
    // Listen to both Person and Company
    return Object;
  }

  async afterInsertCommitted(event: InsertEvent<any>) {
    if (event.entity instanceof Person) {
      eventLog.push(`Person inserted: ${event.entity.name}`);
    } else if (event.entity instanceof Company) {
      eventLog.push(`Company inserted: ${event.entity.name}`);
    }
  }

  async afterUpdateCommitted(event: UpdateEvent<any>) {
    if (event.entity instanceof Person) {
      eventLog.push(`Person updated: ${event.entity.name}`);
    } else if (event.entity instanceof Company) {
      eventLog.push(`Company updated: ${event.entity.name}`);
    }
  }

  async afterRemoveCommitted(event: RemoveEvent<any>) {
    if (event.entity instanceof Person) {
      eventLog.push(`Person removed: ${event.entity.name}`);
    } else if (event.entity instanceof Company) {
      eventLog.push(`Company removed: ${event.entity.name}`);
    }
  }

  async afterSoftRemoveCommitted(event: SoftRemoveEvent<any>) {
    if (event.entity instanceof Person) {
      eventLog.push(`Person soft removed: ${event.entity.name}`);
    } else if (event.entity instanceof Company) {
      eventLog.push(`Company soft removed: ${event.entity.name}`);
    }
  }
}
