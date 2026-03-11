import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/accounts/[id] - Get account details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const account = await prisma.bankAccount.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      bank: true,
      accountId: true,
      accountName: true,
      currency: true,
      lastSyncAt: true,
      isActive: true,
    },
  })
  
  if (!account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  }
  
  return NextResponse.json(account)
}

// DELETE /api/accounts/[id] - Disconnect account
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.bankAccount.update({
    where: { id: params.id },
    data: { isActive: false },
  })
  
  return new NextResponse(null, { status: 204 })
}
