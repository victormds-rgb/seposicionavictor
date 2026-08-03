import { randomUUID } from "node:crypto";
import type { UuidGenerator } from "@/shared/domain/uuid-generator";

export class SystemUuidGenerator implements UuidGenerator {
  generate(): string {
    return randomUUID();
  }
}
