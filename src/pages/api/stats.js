import s3 from '../../utils/aws-s3';
import db from '../../utils/database';

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const response = await db.query(`SELECT 
            COUNT(*) FILTER (WHERE update_date::date = CURRENT_DATE and deleted = false) AS todays_transcriptions,
            COUNT(*) FILTER (WHERE update_date IS NOT NULL and deleted = false) AS total_transcribed,
            COUNT(*) FILTER (WHERE update_date IS NULL and deleted = false) AS remaining_transcriptions
        FROM 
            stt_transcripts.transcripts t;
        `)
            const stat_data = response.rows[0]
            res.status(200).json({ stat_data: stat_data });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch stat data' });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}