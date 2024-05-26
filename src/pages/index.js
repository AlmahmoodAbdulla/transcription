import useSWR from 'swr';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { Button, TextField, Container, Box, Typography, Paper, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useEffect, useState } from 'react';

const fetcher = url => axios.get(url).then(res => res.data);

// const StyledAudioContainer = styled(Paper)(({ theme }) => ({
//   padding: theme.spacing(2),
//   margin: theme.spacing(2, 0),
//   backgroundColor: '#f5f5f5'  // A light grey background
// }));

const StyledAudioContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1),
  margin: theme.spacing(2, 0),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'transparent',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(0.5),
    margin: theme.spacing(1, 0),
  }
}));

export default function Home() {
  const { data, mutate, error } = useSWR('/api/audio', fetcher);
  const { register, handleSubmit, reset, setValue } = useForm();
  const [audioKey, setAudioKey] = useState(0);  // Used to force re-render the audio component on error

  useEffect(() => {
    if (data && data.transcription) {
      setValue('transcription', data.transcription);
    }
  }, [data, setValue]);

  const onSubmit = async (formData) => {
    await axios.post('/api/audio', { id: data.id, transcription: formData.transcription });
    mutate();
    reset({ transcription: '' });
  };

  const reloadAudio = () => {
    setAudioKey(prevKey => prevKey + 1);  // Increment key to force re-render of audio component
  };

  const skipAudio = () => {
    mutate();  // Refetch the next audio without submitting anything
  };

  if (error) return <Typography variant="h6" color="error">Failed to load: {error}</Typography>;
  if (!data) return (
    <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
      <CircularProgress color="primary" />
    </Box>
  );

  return (
    <Container maxWidth="sm" sx={{ pt: 3, pb: 3}}>
      <Typography variant="h5" gutterBottom align="center">
        Audio id: {data.id}
      </Typography>
      <Typography variant="h5" gutterBottom align="center">
        {data.file_name}
      </Typography>
      <StyledAudioContainer>
        <audio 
          controls 
          autoPlay 
          loop 
          src={data.file} 
          style={{ width: '100%' }} 
          key={audioKey}  // Use key to force re-render on error
          onError={reloadAudio}  // Handle audio load error
        />
      </StyledAudioContainer>
      <form onSubmit={handleSubmit(onSubmit)}>
        <TextField
          fullWidth
          label="Transcription"
          {...register('transcription')}
          multiline
          rows={2}
          variant="outlined"
          margin="normal"
          inputProps={{ style: { direction: 'rtl', backgroundColor: 'white' } }}
        />
        <Box textAlign="center" marginTop={2}>
          <Button fullWidth type="submit" variant="contained" color="primary" size="large">
            Save and Next
          </Button>
          </Box>
          <Box textAlign="center" marginTop={2}>
          <Button fullWidth onClick={skipAudio} variant="contained" color="secondary" size="large">
            Skip
          </Button>
          </Box>
      </form>
      <Box sx={{pt: 5}}>
      <Typography variant="h5" gutterBottom>
        Remaining Transcriptions: {data.remaining_transcriptions}
      </Typography>
      </Box>
    </Container>
  );
}
