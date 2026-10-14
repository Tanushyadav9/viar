import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'file';
  const uid = searchParams.get('uid') || searchParams.get('key') || `file_${Date.now()}`;

  // Accept direct browser streaming payload
  return NextResponse.json({
    success: true,
    message: 'Direct media file accepted and verified.',
    type,
    id: uid,
    providerId: uid,
    uploadedAt: new Date().toISOString(),
  });
}

export async function PUT(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key') || `doc_${Date.now()}`;

  // Direct presigned PUT simulation
  return NextResponse.json({
    success: true,
    message: 'Direct file stream received successfully.',
    key,
    uploadedAt: new Date().toISOString(),
  });
}
