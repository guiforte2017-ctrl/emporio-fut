import { NextResponse } from "next/server";
import { computeAverageCosts } from "@/lib/fifo";

export async function GET() {
  const averages = await computeAverageCosts();
  return NextResponse.json(averages);
}
