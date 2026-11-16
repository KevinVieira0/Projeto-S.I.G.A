import { Prisma } from "@/generated/prisma/client";

export function filtrarIdsNoSql(coluna, ids) {
  if (!ids) return Prisma.empty;
  return Prisma.sql`AND ${coluna} IN (SELECT jsonb_array_elements_text(${JSON.stringify(ids)}::jsonb))`;
}
