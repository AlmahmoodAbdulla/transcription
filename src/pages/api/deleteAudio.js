import db from '../../utils/database';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        console.log("\nReq Data", req.body)
        const { id } = req.body;
        await db.query('UPDATE stt_transcripts.transcripts SET deleted = true, update_date = now() WHERE id = $1', [id]);
        res.status(200).json({ message: 'Transcription updated successfully.' });
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}