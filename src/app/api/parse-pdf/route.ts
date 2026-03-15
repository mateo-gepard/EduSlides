export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file || file.type !== 'application/pdf') {
      return Response.json(
        { error: 'Please upload a valid PDF file.' },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Dynamic import to keep the bundle lean
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);

    return Response.json({
      text: data.text,
      pages: data.numpages,
      info: data.info,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'PDF parsing failed';
    return Response.json({ error: message }, { status: 500 });
  }
}
