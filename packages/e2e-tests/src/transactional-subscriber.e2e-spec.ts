import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "testcontainers";
import { DataSource } from "typeorm";
import { Person } from "sample-application/src/entities/Person";
import { Company } from "sample-application/src/entities/Company";
import { eventLog } from "sample-application/src/EventLog";

async function startTestPostgresContainer() {
  try {
    const container = await new PostgreSqlContainer(
      "postgres:15-alpine"
    ).start();

    process.env.DB_HOST = container.getHost();
    process.env.DB_PORT = container.getPort().toString();
    process.env.DB_USER = container.getUsername();
    process.env.DB_PASS = container.getPassword();
    process.env.DB_NAME = container.getDatabase();

    return container;
  } catch (error) {
    throw new Error(
      "Failed to start PostgreSQL Docker container. Please ensure Docker is running and accessible.\n" +
        (error instanceof Error ? error.message : String(error))
    );
  }
}

describe("TransactionalSubscriber", () => {
  let container: StartedPostgreSqlContainer;
  let dataSource: DataSource;

  beforeAll(async () => {
    container = await startTestPostgresContainer();

    // Dynamically import AppDataSource after env vars are set
    const { AppDataSource } = await import(
      "sample-application/src/data-source"
    );

    dataSource = AppDataSource;

    await dataSource.initialize();

    console.log("Database initialized");
  });

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }

    if (container) {
      await container.stop();
    }
  });

  beforeEach(() => {
    eventLog.length = 0;
  });

  it("should call afterInsertCommitted only after transaction commit", async () => {
    // Arrange
    // (Setup is handled by beforeEach)

    // Act
    await dataSource.manager.transaction(async (manager) => {
      const person = new Person();
      person.name = "Alice";
      await manager.save(person);
      expect(eventLog).toHaveLength(0);

      const company = new Company();
      company.name = "Widgets Ltd.";
      await manager.save(company);

      expect(eventLog).toHaveLength(0);
    });

    // Assert
    expect(eventLog).toEqual([
      "Person inserted: Alice",
      "Company inserted: Widgets Ltd.",
    ]);
  });

  it("should not call afterInsertCommitted if transaction is rolled back", async () => {
    // Arrange
    // (Setup is handled by beforeEach)

    // Act
    await expect(
      dataSource.manager.transaction(async (manager) => {
        const person = new Person();
        person.name = "Bob";
        await manager.save(person);
        throw new Error("Force rollback");
      })
    ).rejects.toThrow("Force rollback");

    // Assert
    expect(eventLog).toHaveLength(0);
  });

  it("should call afterUpdateCommitted only after transaction commit", async () => {
    // Arrange
    const person = new Person();
    person.name = "Charlie";
    await dataSource.manager.save(person);
    eventLog.length = 0;

    // Act
    await dataSource.manager.transaction(async (manager: any) => {
      person.name = "Charlie Updated";
      await manager.save(person);
      expect(eventLog).toHaveLength(0);
    });

    // Assert
    expect(eventLog).toEqual(["Person updated: Charlie Updated"]);
  });

  it("should call afterRemoveCommitted only after transaction commit", async () => {
    // Arrange
    const company = new Company();
    company.name = "Acme Corp";
    await dataSource.manager.save(company);
    eventLog.length = 0;

    // Act
    await dataSource.manager.transaction(async (manager: any) => {
      await manager.remove(company);
      expect(eventLog).toHaveLength(0);
    });

    // Assert
    expect(eventLog).toEqual(["Company removed: Acme Corp"]);
  });

  it("should only call afterInsertCommitted after outermost commit with nested transactions", async () => {
    // Arrange
    eventLog.length = 0;

    // Act
    await dataSource.manager.transaction(async (outerManager: any) => {
      const person = new Person();
      person.name = "Nested One";
      await outerManager.save(person);
      expect(eventLog).toHaveLength(0);

      await outerManager.transaction(async (innerManager: any) => {
        const company = new Company();
        company.name = "Nested Co";
        await innerManager.save(company);
        // Still not committed, should not see any events
        expect(eventLog).toHaveLength(0);
      });

      // Still not committed, should not see any events
      expect(eventLog).toHaveLength(0);
    });

    // Assert
    expect(eventLog).toEqual([
      "Person inserted: Nested One",
      "Company inserted: Nested Co",
    ]);
  });
});
