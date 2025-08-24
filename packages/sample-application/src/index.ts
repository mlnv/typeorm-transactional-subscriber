import 'reflect-metadata';
import { AppDataSource } from './data-source';
import { Person } from './entities/Person';
import { Company } from './entities/Company';
import { eventLog } from './EventLog';

export async function runSample() {
  await AppDataSource.initialize();
  const personRepo = AppDataSource.getRepository(Person);
  const companyRepo = AppDataSource.getRepository(Company);

  try {
    await AppDataSource.manager.transaction(async (manager) => {
      const person = new Person();
      person.name = 'John Doe';
      await manager.save(person);

      const company = new Company();
      company.name = 'Acme Inc.';
      await manager.save(company);
    });
    console.log('Transaction committed. Event log:', eventLog);
  } catch (err) {
    console.error('Transaction rolled back:', err);
    console.log('Event log after rollback:', eventLog);
  } finally {
    await AppDataSource.destroy();
  }
}

if (require.main === module) {
  runSample();
}
