import { cleanupFixtures, FIXTURE } from "./fixtures.mts";

const counts = await cleanupFixtures();
console.log("Staging fixture cleanup complete.");
console.log(`Fixture IDs: ${Object.values(FIXTURE.companies).join(", ")}, ${FIXTURE.campaign}, ${FIXTURE.driver}, ${FIXTURE.qr}`);
console.log(`Dependent rows deleted: ${Object.entries(counts).map(([table, count]) => `${table}=${count}`).join(", ")}`);
