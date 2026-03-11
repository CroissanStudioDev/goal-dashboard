import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/accounts - List all connected bank accounts
export async function GET() {
  const accounts = await prisma.bankAccount.findMany({
    where: { isActive: true },
    select: {
      id: true,
      bank: true,
      accountId: true,
      accountName: true,
      currency: true,
      lastSyncAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })
  
  return NextResponse.json(accounts)
}
