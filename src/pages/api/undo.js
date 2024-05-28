// /pages/api/undo.js
import db from '../../utils/database';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { id } = req.body;

        // Fetch the current data
        const response = await db.query('SELECT * FROM stt_transcripts.transcripts WHERE id = $1', [id]);
        const file = response.rows[0];

        if (!file.old_transcription || file.old_transcription.length === 0) {
            return res.status(400).json({ message: 'No old transcription found to undo.' });
        }

        // Extract the latest old transcription
        const latestOldTranscription = file.old_transcription.pop();

        // Update the record
        await db.query(
            'UPDATE stt_transcripts.transcripts SET transcription = $1, old_transcription = $2, update_date = NULL WHERE id = $3',
            [latestOldTranscription.transcription, file.old_transcription.length > 0 ? JSON.stringify(file.old_transcription) : null, id]
        );

        res.status(200).json({
            message: 'Undo successful, transcription restored.',
            oldTranscription: latestOldTranscription.transcription,
            newTranscription: file.transcription
        });
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}