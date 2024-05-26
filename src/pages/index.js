import useSWR from 'swr';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { Button, TextField, Container, Box, Typography, Paper, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useState, useEffect } from 'react';


const fetcher = url => axios.get(url).then(res => res.data);

const StyledAudioContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  margin: theme.spacing(2, 0),
  backgroundColor: '#f5f5f5'  // A light grey background
}));

export default function Home() {
  const { data, mutate, error } = useSWR('/api/audio', fetcher, { revalidateOnFocus: false });
  const { register, handleSubmit, reset, setValue } = useForm();
  const [transcription, setTranscription] = useState('');

  useEffect(() => {
    if (data && data.transcription) {
      setTranscription(data.transcription); // Update transcription state when data changes
      setValue('transcription', data.transcription); // Update form value if using react-hook-form
    }
  }, [data, setValue]);

  const onSubmit = async (formData) => {
    await axios.post('/api/audio', { id: data.id, transcription: formData.transcription });
    mutate(); // Refetch the next audio
    reset({ transcription: '' }); // Optionally reset form to initial state
  };

  if (error) return <Typography variant="h6" color="error">Failed to load</Typography>;
  if (!data) return <CircularProgress color="primary" />;

  console.log("data", data);

  return (
    <Container maxWidth="md" sx={{ pt: 5, pb: 5, mb: 5 }}>
      <Typography pt="10" variant="h4" gutterBottom style={{ textAlign: 'center' }}>
        Audio id: {data.id}
      </Typography>
      <StyledAudioContainer>
        <audio controls autoPlay loop src={data.file} style={{ width: '100%' }} />
      </StyledAudioContainer>
      <form onSubmit={handleSubmit(onSubmit)}>
        <TextField
          fullWidth
          label="Transcription"
          value={transcription}
          onChange={e => setTranscription(e.target.value)}
          {...register('transcription')}  // Connect field to React Hook Form
          multiline
          rows={4}
          variant="outlined"
          margin="normal"
          inputProps={{ style: { direction: 'rtl' } }}
        />
        <Box textAlign="center" marginTop={2}>
          <Button fullWidth type="submit" variant="contained" color="primary" size="large">
            Save and Next
          </Button>
        </Box>
      </form>
    </Container>
  );
}
