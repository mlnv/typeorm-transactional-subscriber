// Sample usage of typeorm-transactional-subscriber
import { helloTransactionalSubscriber } from 'typeorm-transactional-subscriber';

export function runSample() {
  console.log(helloTransactionalSubscriber());
}

if (require.main === module) {
  runSample();
}
