import { pgTable, varchar, text, serial } from "drizzle-orm/pg-core";

export const summaryTable = pgTable("summary", {
  id: serial().primaryKey(),
  title: varchar({ length: 255 }).notNull(),
  content: text().notNull(),
});
