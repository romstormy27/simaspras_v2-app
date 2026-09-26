import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { generateBastPdfBuffer } from '@/lib/pdf/generate-bast';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Harap login terlebih dahulu' }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID BAST tidak valid' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const download = searchParams.get('download') === 'true';

    const { buffer, nomor_bast } = await generateBastPdfBuffer(id);

    const sanitizedFilename = nomor_bast.replace(/[\/\\]/g, '_');
    const dispositionType = download ? 'attachment' : 'inline';

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${dispositionType}; filename="${sanitizedFilename}.pdf"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menghasilkan berkas PDF BAST Digital';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
