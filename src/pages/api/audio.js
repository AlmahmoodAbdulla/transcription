import s3 from '../../utils/aws-s3';
import db from '../../utils/database';

export default async function handler(req, res) {
    // console.log("S3 \n", s3)
    if (req.method === 'GET') {
        const response = await db.query("select * from stt_transcripts.transcripts t where old_transcription is null and deleted = false ORDER BY random() limit 1");
        const file = response.rows[0];
        const signedUrl = s3.getSignedUrl('getObject', {
            Bucket: 'transcriptionaudioclips',
            Key: file.file_name.trim(),
            Expires: 300 // Link expiration (seconds)
        });
        res.status(200).json({ file: signedUrl, transcription: file.transcription, id: file.id, remaining_transcriptions: file.remaining_transcriptions, file_name: file.file_name });
    } else if (req.method === 'POST') {
        // console.log("\nReq Data", req.body)
        const { id, transcription } = req.body;
        const response = await db.query('select * from stt_transcripts.transcripts t where id=$1', [id]);
        const file = response.rows[0];
        const newHistory = {
            transcription: file.transcription,
            updated_at: new Date()  // Storing the time of update
        };

        const newTranscriptionHistory = file.old_transcription ?
            [...file.old_transcription, newHistory] :
            [newHistory];
        await db.query('UPDATE stt_transcripts.transcripts SET transcription = $1, old_transcription = $3, update_date = now() WHERE id = $2', [transcription, id, JSON.stringify(newTranscriptionHistory)]);
        res.status(200).json({ message: 'Transcription updated successfully.' });
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
