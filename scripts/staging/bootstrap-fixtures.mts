import { bootstrapFixtures, FIXTURE } from "./fixtures.mts";

await bootstrapFixtures();
console.log("Staging fixtures ready.");
console.log(`Fixture IDs: ${Object.values(FIXTURE.companies).join(", ")}, ${FIXTURE.campaign}, ${FIXTURE.driver}, ${FIXTURE.qr}`);
